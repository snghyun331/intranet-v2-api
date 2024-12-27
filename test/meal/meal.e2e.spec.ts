import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { MealModule } from '../../src/module/meal/meal.module';
import { CreateMealDto } from '../../src/module/meal/dto/createMeal.dto';
import { AttendanceEnum } from '../../src/common/constant/enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG_TEST } from '../../src/config/database.config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/module/auth/auth.module';
import { UserModule } from '../../src/module/user/user.module';
import { JwtService } from '@nestjs/jwt';
import { MealCalenderResult } from '../../src/module/meal/interface/result.interface';

describe('UserMealController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync(DATABASE_CONFIG_TEST),
        AuthModule,
        MealModule,
        UserModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    const jwtService: JwtService = app.get(JwtService);

    accessToken = jwtService.sign({
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

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UserMealController', () => {
    it('/users/meals (POST)', async () => {
      const createMealDto: CreateMealDto = {
        targetDay: '2024-10-29',
        breakfast: { payerName: '', place: '', amount: null },
        lunch: { payerName: '이승현', place: '김가네', amount: 5000 },
        dinner: { payerName: '', place: '', amount: null },
        attendance: AttendanceEnum.WORKING,
      };

      const response = await request(app.getHttpServer())
        .post('/users/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createMealDto)
        .expect(201);

      expect(response.body.message).toBe('식대 사용내역 저장 성공');
    });

    it('/users/meals (GET)', async () => {
      const mockResult: MealCalenderResult = {
        mealStats: {
          year: '2024',
          month: '10',
          mealBudget: 230000,
          mealExpense: 5000,
          mealBalance: 0,
          userName: '이승현',
        },
        meals: [
          {
            start: '2024-10-29',
            holidayYN: 'N',
            breakfast: { payerName: '', place: '', amount: null },
            lunch: { payerName: '이승현', place: '김가네', amount: 5000, attendance: '근무' },
            dinner: { payerName: '', place: '', amount: null },
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .get('/users/meals')
        .query({ year: '2024', month: '10' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('식대 사용내역 조회 성공');
      expect(response.body.data).toEqual(mockResult);
    });

    it('/users/meals/:targetDay (DELETE)', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/meals/2024-10-29')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('식대 사용내역 초기화 성공');
    });
  });
});
