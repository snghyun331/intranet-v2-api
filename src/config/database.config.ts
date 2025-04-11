import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const TYPEORM_CONFIG: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    type: 'mariadb',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PW'),
    database: configService.get<string>('DB_NAME'),
    charset: 'utf8mb4',
    entities: [join(__dirname, '../entity/**/*.entity{.ts,.js}')],
    synchronize: true,
    logging: true,
  }),
};

export const TEST_TYPEORM_CONFIG: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService): Promise<TypeOrmModuleOptions> => ({
    type: 'mariadb',
    host: configService.get<string>('TEST_DB_HOST'),
    port: configService.get<number>('TEST_DB_PORT'),
    username: configService.get<string>('TEST_DB_USER'),
    password: configService.get<string>('TEST_DB_PW'),
    database: configService.get<string>('TEST_DB_NAME'),
    charset: 'utf8mb4',
    entities: [join(__dirname, '../entity/**/*.entity{.ts,.js}')],
    synchronize: true,
  }),
};

export const MONGOOSE_CONFIG: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URL'),
    dbName: 'lunch_group',
  }),
};
