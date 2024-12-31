import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/module/auth/auth.module';
import { MealModule } from '../src/module/meal/meal.module';
import { UserModule } from '../src/module/user/user.module';
import { DATABASE_CONFIG_TEST } from '../src/config/database.config';
import { JwtService } from '@nestjs/jwt';
import { INestApplication } from '@nestjs/common';

export const createTestApp = async (
  modules: any[],
): Promise<{ app: INestApplication; userAccessToken: string; adminAccessToken: string }> => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRootAsync(DATABASE_CONFIG_TEST),
      AuthModule,
      ...modules,
      UserModule,
    ],
  }).compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  const jwtService: JwtService = app.get(JwtService);

  const userAccessToken: string = jwtService.sign({
    userIdx: 1,
    userName: '이승현',
    userGender: 'W',
    userBirth: '2000-03-31',
    joinDate: '2004-03-04',
    hqName: 'HR솔루션본부',
    teamName: 'HR Tech',
    gradeName: '본부장',
    adminRole: 'Y',
  });

  const adminAccessToken: string = jwtService.sign({
    adminIdx: 1,
    adminName: '이승현',
    adminEmail: 'shlee1@acghr.co.kr',
    adminGradeName: '상위 관리자',
    hqName: 'HR솔루션본부',
    teamName: 'HR Tech',
    gradeName: '본부장',
  });

  await app.init();

  return { app, userAccessToken, adminAccessToken };
};

export const createTestAppWithMeal = async (): Promise<{
  app: INestApplication;
  userAccessToken: string;
  adminAccessToken: string;
}> => {
  return createTestApp([MealModule]);
};

export const closeTestApp = async (app: INestApplication): Promise<void> => {
  await app.close();
};
