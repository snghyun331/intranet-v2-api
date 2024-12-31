import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';

export const DATABASE_CONFIG: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'mariadb',
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PW'),
    database: configService.get<string>('DB_NAME'),
    charset: 'utf8mb4',
    entities: ['dist/**/*.entity.js'],
    synchronize: true,
  }),
};

export const DATABASE_CONFIG_TEST: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'mariadb',
    host: configService.get<string>('TEST_DB_HOST'),
    port: configService.get<number>('TEST_DB_PORT'),
    username: configService.get<string>('TEST_DB_USER'),
    password: configService.get<string>('TEST_DB_PW'),
    database: configService.get<string>('TEST_DB_NAME'),
    charset: 'utf8mb4',
    entities: [__dirname + '/../**/*.entity.{ts,js}'],
    synchronize: true,
  }),
};
