import { InternalServerErrorException } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';

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
    // logging: true,
  }),

  async dataSourceFactory(option) {
    if (!option) throw new InternalServerErrorException('Invalid options passed');

    return addTransactionalDataSource(new DataSource(option));
  },
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

  async dataSourceFactory(option) {
    if (!option) throw new InternalServerErrorException('Invalid options passed');

    return addTransactionalDataSource(new DataSource(option));
  },
};

export const MONGOOSE_CONFIG: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URL'),
    dbName: 'lunch_group',
  }),
};
