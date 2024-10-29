import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/schemas/user.schema';
import { SigninDto, SignupDto } from 'src/dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
    ) { }

    async signup(createUserDto: SignupDto) {
        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
        const user = new this.userModel({
            ...createUserDto,
            password: hashedPassword,
        });
        await user.save();
        return { message: 'User registered successfully' };
    }

    async signin(userDto: SigninDto) {
        const { email, password } = userDto;
        const user = await this.userModel.findOne({ email });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user._id, email: user.email };
        return {
            message: 'Login successful',
            access_token: this.jwtService.sign(payload),
            refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
        };
    }

    async refreshToken(token: string) {
        try {
            const decoded = this.jwtService.verify(token);
            const payload = { sub: decoded.sub, email: decoded.email };
            return {
                message: 'Token refreshed successfully',
                access_token: this.jwtService.sign(payload),
                refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async getProfile(userId: string) {

        const user = await this.userModel.findById(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...profile } = user.toObject();

        return { profile };
    }

}