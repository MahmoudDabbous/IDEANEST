import { ConfigService } from "@nestjs/config";

export const MongooseConfig = {
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${encodeURIComponent(configService.get('MONGO_USERNAME', 'root'))}:${encodeURIComponent(configService.get('MONGO_PASSWORD', 'password'))}@${configService.get('MONGO_HOST', '127.0.0.1')}:${configService.get('MONGO_PORT', '27017')}/${configService.get('MONGO_DATABASE', 'org')}?authSource=admin`,
        retryAttempts: 10,
        retryDelay: 3000,
        connectionFactory: (connection) => {
            connection.set('debug', configService.get('NODE_ENV') !== 'production');
            return connection;
        },
    }),
}