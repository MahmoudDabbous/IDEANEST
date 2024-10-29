import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrganizationsModule } from './organizations/organizations.module';
import mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
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
    }),
    AuthModule,
    OrganizationsModule
  ],
})
export class AppModule { }