import { Module } from '@nestjs/common';
import { REDIS_CLIENT, RedisClientProvider } from 'src/config/redis.config';

@Module({
    providers: [
        RedisClientProvider,
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule { }
