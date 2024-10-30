import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from 'src/schemas/user.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from 'src/auth/auth.service';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { AuthController } from './auth.controller';
import { JWTConfig } from 'src/config/jwt.config';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.registerAsync(JWTConfig),
        RedisModule
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService],
}) export class AuthModule { }
