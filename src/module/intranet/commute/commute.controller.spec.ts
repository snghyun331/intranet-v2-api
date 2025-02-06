import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG } from '../../../config/database.config';

describe('UserCommuteController', () => {
  let app: INestApplication;
  let userAccessToken: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRootAsync(DATABASE_CONFIG),
      ],
    }).compile();

    app = module.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('[GET] /please', () => {
    it('pleasepleasepleaseplease', async () => {});
  });
});
