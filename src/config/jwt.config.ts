import { ConfigService } from "@nestjs/config";

export const JWTConfig = {
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', '123456'),
        signOptions: { expiresIn: '1h' },
    })
}