import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { MealService } from '../../src/module/meal/meal.service';
import { MealModule } from '../../src/module/meal/meal.module';
import { CreateMealDto } from '../../src/module/meal/dto/createMeal.dto';
import { AttendanceEnum } from '../../src/common/constant/enum';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG_TEST } from '../../src/config/database.config';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/module/auth/auth.module';
import { UserModule } from '../../src/module/user/user.module';
import { AuthService } from '../../src/module/auth/auth.service';
import { JwtService } from '@nestjs/jwt';

describe('MealController (e2e)', () => {
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
      joinDate: '2024-03-04',
      hqName: 'HR솔류션본부',
      teamName: 'HR Tech',
      gradeName: '대표',
      adminRole: 'Y',
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('UserMealController', () => {
    it('/users/meals (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/meals')
        .query({ year: '2023', month: '10' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('식대 사용내역 조회 성공');
    });

    it('/users/meals (POST)', async () => {
      const createMealDto: CreateMealDto = {
        targetDay: '2024-11-10',
        breakfast: { payerName: null, place: null, amount: null },
        lunch: { payerName: '이승현', place: 'Cafe', amount: 20 },
        dinner: { payerName: '이승현', place: 'Cafe', amount: 30 },
        attendance: AttendanceEnum.WORKING,
      };

      const response = await request(app.getHttpServer())
        .post('/users/meals')
        .send(createMealDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.message).toBe('식대 사용내역 저장 성공');
    });

    it('/users/meals/:targetDay (DELETE)', async () => {
      const response = await request(app.getHttpServer())
        .delete('/users/meals/2023-10-10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('식대 사용내역 초기화 성공');
    });
  });

  //   describe('AdminMealController', () => {
  //     it('/admin/meals (GET)', async () => {
  //       const pageNoDto: PageNoDto = { pageNo: 1, perPage: 10 };
  //       const filterInfo: AdminMealFilterDto = { sDate: '2023-10-01', eDate: '2023-10-31' };

  //       const response = await request(app.getHttpServer())
  //         .get('/admin/meals')
  //         .query({ ...pageNoDto, ...filterInfo })
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('어드민 식대 내역 조회 성공');
  //     });

  //     it('/admin/meals/budget (POST)', async () => {
  //       const createMealBudgetDto: CreateMealBudgetDto = {
  //         year: '2023',
  //         month: '10',
  //         baseAmount: 1000,
  //       };

  //       const response = await request(app.getHttpServer())
  //         .post('/admin/meals/budget')
  //         .send(createMealBudgetDto)
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(201);

  //       expect(response.body.message).toBe('어드민 식대 설정 등록 및 수정 성공');
  //     });

  //     it('/admin/meals/budget (GET)', async () => {
  //       const pageNoDto: PageNoDto = { pageNo: 1, perPage: 10 };
  //       const filterInfo: AdminMealBudgetFilterDto = { year: '2023', month: '10' };

  //       const response = await request(app.getHttpServer())
  //         .get('/admin/meals/budget')
  //         .query({ ...pageNoDto, ...filterInfo })
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('10월 어드민 식대 설정 리스트 조회 성공');
  //     });

  //     it('/admin/meals/budget/:mealStatsIdx (PATCH)', async () => {
  //       const updateNoteDto: UpdateNoteDto = { note: 'Updated note' };

  //       const response = await request(app.getHttpServer())
  //         .patch('/admin/meals/budget/1')
  //         .send(updateNoteDto)
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('비고 수정 성공');
  //     });

  //     it('/admin/meals/balances (GET)', async () => {
  //       const filterInfo: AdminMealBalanceFilterDto = { year: '2023', month: '10' };

  //       const response = await request(app.getHttpServer())
  //         .get('/admin/meals/balances')
  //         .query(filterInfo)
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('어드민 10월 식대 정산 조회 성공');
  //     });

  //     it('/admin/meals/balances (PATCH)', async () => {
  //       const mealStatsIdxList = [1, 2, 3];

  //       const response = await request(app.getHttpServer())
  //         .patch('/admin/meals/balances')
  //         .send({ mealStatsIdxList })
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('어드민 식대 정산완료 처리 성공');
  //     });

  //     it('/admin/meals/balances/cancel (PATCH)', async () => {
  //       const mealStatsIdxList = [1, 2, 3];

  //       const response = await request(app.getHttpServer())
  //         .patch('/admin/meals/balances/cancel')
  //         .send({ mealStatsIdxList })
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('어드민 식대 정산완료 취소 처리 성공');
  //     });

  //     it('/admin/meals/balances/:mealStatsIdx (GET)', async () => {
  //       const response = await request(app.getHttpServer())
  //         .get('/admin/meals/balances/1')
  //         .set('Authorization', 'Bearer accessToken')
  //         .expect(200);

  //       expect(response.body.message).toBe('success');
  //     });
  //   });
});
