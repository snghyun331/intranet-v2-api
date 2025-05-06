import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TEST_TYPEORM_CONFIG } from '../src/config/database.config';
import { AuthModule } from '../src/module/auth/auth.module';
import { MockUserModule } from '../src/module/user/user.module';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminGradeEnum, GenderEnum, UserGradeEnum, YNEnum } from '../src/common/constant/enum';
import { MealModule } from '../src/module/meal/meal.module';
import { CommuteModule } from '../src/module/intranet/commute/commute.module';
import { LeaveModule } from '../src/module/intranet/leave/leave.module';
import { WelfareModule } from '../src/module/welfare/welfare.module';
import { GlobalModule } from '../src/module/global/global.module';

const createTestApp = async (modules: any[]) => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        envFilePath: '.env.test',
        isGlobal: true,
      }),
      TypeOrmModule.forRootAsync(TEST_TYPEORM_CONFIG),
      AuthModule,
      MockUserModule,
      GlobalModule,
      ...modules,
    ],
  }).compile();

  const app: INestApplication = module.createNestApplication();
  const jwtService: JwtService = app.get(JwtService);

  const userAccessToken: string = jwtService.sign({
    userIdx: 1,
    userName: '관리자',
    userGender: GenderEnum.WOMAN,
    userBirth: '1980-01-01',
    joinDate: '2021-01-01',
    hqName: 'P&C',
    teamName: 'P&C',
    gradeName: UserGradeEnum.MANAGER,
    adminRole: YNEnum.YES,
  });

  const adminAccessToken: string = jwtService.sign({
    adminIdx: 1,
    adminName: '관리자',
    adminEmail: 'email@acghr.co.kr',
    adminGradeName: AdminGradeEnum.HIGH_ADMIN,
    hqName: 'P&C',
    teamName: 'P&C',
    gradeName: UserGradeEnum.MANAGER,
  });

  await app.init();

  return { app, userAccessToken, adminAccessToken };
};

export const createTestAppWithMeal = async () => createTestApp([MealModule]);
export const createTestAppWithWelfare = async () => createTestApp([WelfareModule]);
export const createTestAppWithCommute = async () => createTestApp([CommuteModule, LeaveModule]);

export const closeTestApp = async (app: INestApplication): Promise<void> => await app.close();
