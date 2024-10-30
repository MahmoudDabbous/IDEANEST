import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

const createRedisClient = async (url: string) => {
    const client = createClient({ url });

    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();

    return client;
};

export const REDIS_CLIENT: string = 'REDIS_CLIENT'
export const RedisClientProvider = {
    provide: REDIS_CLIENT,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        const client = await createRedisClient(redisUrl);
        return client;
    },
};
