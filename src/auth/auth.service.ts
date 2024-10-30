import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from 'src/schemas/user.schema';
import { SigninDto, SignupDto } from 'src/dto/auth.dto';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT } from 'src/config/redis.config';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService,
        @Inject(REDIS_CLIENT) private readonly redisClient: RedisClientType,
    ) { }

    private async isTokenRevoked(token: string): Promise<boolean> {
        const isRevoked = await this.redisClient.get(`revoked_token:${token}`);
        return !!isRevoked;
    }

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
        const access_token = this.jwtService.sign(payload);
        const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });

        await this.redisClient.set(
            `refresh_token:${refresh_token}`,
            user._id.toString(),
            { EX: 7 * 24 * 60 * 60 }
        );

        return {
            message: 'Login successful',
            access_token,
            refresh_token,
        };
    }

    async refreshToken(token: string) {
        try {
            if (await this.isTokenRevoked(token)) {
                throw new UnauthorizedException('Token has been revoked');
            }

            const decoded = this.jwtService.verify(token);
            const payload = { sub: decoded.sub, email: decoded.email };

            const new_refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' });


            await this.redisClient.del(`refresh_token:${token}`);
            await this.redisClient.set(
                `refresh_token:${new_refresh_token}`,
                decoded.sub,
                { EX: 7 * 24 * 60 * 60 }
            );

            return {
                message: 'Token refreshed successfully',
                access_token: this.jwtService.sign(payload),
                refresh_token: new_refresh_token,
            };
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async revokeRefreshToken(token: string) {
        try {
            const decoded = this.jwtService.verify(token);

            await this.redisClient.del(`refresh_token:${token}`);

            await this.redisClient.set(
                `revoked_token:${token}`,
                'revoked',
                { EX: 7 * 24 * 60 * 60 }
            );

            return { message: 'Refresh token revoked successfully' };
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