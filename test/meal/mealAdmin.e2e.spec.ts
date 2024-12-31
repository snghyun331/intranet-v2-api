import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestAppWithMeal } from '../test-utility';
import { MealAdminResult, MealBudgetAdminResult } from '../../src/module/meal/interface/result.interface';
import { CreateMealBudgetDto } from '../../src/module/meal/dto/createBudget.dto';
import { MealRepository } from '../../src/module/meal/repository/meal.repository';
import { MealStatsAdminInfo } from '../../src/module/meal/interface/meal.interface';
import { MealEntity } from '../../src/entity/meal/meal.entity';

describe('AdminMealController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let mealRepository: MealRepository;

  beforeAll(async () => {
    const result = await createTestAppWithMeal();
    app = result.app;
    accessToken = result.adminAccessToken;
    mealRepository = app.get(MealRepository);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('[GET] /admin/meals', () => {
    let response: any;
    const pageNo: number = 1;
    const perPage: number = 20;
    const sDate: string = '2024-10-01';
    const eDate: string = '2024-10-31';

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get('/admin/meals')
        .query({ pageNo, perPage, sDate, eDate })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('어드민 식대 내역 조회 성공');
    });

    it('형식이 올바르게 반환되는가?', async () => {
      const data: MealAdminResult = response.body.data;

      expect(data.totalPage).toBeGreaterThanOrEqual(0);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.meal.length).toBeGreaterThanOrEqual(0);

      if (data.meal.length > 0) {
        expect(data.meal[0]).toHaveProperty('mealIdx');
        expect(data.meal[0]).toHaveProperty('gradeName');
        expect(data.meal[0]).toHaveProperty('userIdx');
        expect(data.meal[0]).toHaveProperty('userName');
        expect(data.meal[0]).toHaveProperty('place');
        expect(data.meal[0]).toHaveProperty('targetDay');
        expect(data.meal[0]).toHaveProperty('mealType');
        expect(data.meal[0]).toHaveProperty('amount');
        expect(data.meal[0]).toHaveProperty('payerName');
        expect(data.meal[0]).toHaveProperty('attendance');
      }
    });
  });

  describe('[GET] /admin/meals/budget', () => {
    let response: any;
    const pageNo: number = 1;
    const perPage: number = 20;
    const year: string = '2024';
    const month: string = '10';

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get('/admin/meals/budget')
        .query({ pageNo, perPage, year, month })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe(`${month}월 어드민 식대 설정 리스트 조회 성공`);
    });

    it('형식이 올바르게 반환되는가?', async () => {
      const data: MealBudgetAdminResult = response.body.data;

      expect(data.totalPage).toBeGreaterThanOrEqual(0);
      expect(data.total).toBeGreaterThanOrEqual(0);
      expect(data.workdays).toBeGreaterThanOrEqual(0);
      expect(data.mealBudget.length).toBeGreaterThanOrEqual(0);
      if (data.mealBudget.length > 0) {
        expect(data.mealBudget[0]).toHaveProperty('mealStatsIdx');
        expect(data.mealBudget[0]).toHaveProperty('userIdx');
        expect(data.mealBudget[0]).toHaveProperty('userName');
        expect(data.mealBudget[0]).toHaveProperty('gradeName');
        expect(data.mealBudget[0]).toHaveProperty('mealBudget');
        expect(data.mealBudget[0]).toHaveProperty('note');
        expect(data.mealBudget[0]).toHaveProperty('year');
        expect(data.mealBudget[0]).toHaveProperty('month');
      }
    });
  });

  describe('[POST] /admin/meals/budget', () => {
    const createMealBudgetDto: CreateMealBudgetDto = {
      baseAmount: 10000,
      mealBudget: 23000,
      year: '2024',
      month: '11',
    };

    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .post('/admin/meals/budget')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createMealBudgetDto)
        .expect(201);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('어드민 식대 설정 등록 및 수정 성공');
    });

    it('DB에 값이 제대로 들어갔는가?', async () => {
      const { year, month } = createMealBudgetDto;
      const { baseAmount } = await mealRepository.getMealBaseInfo(year, month);
      expect(baseAmount).toEqual(createMealBudgetDto.baseAmount);
    });
  });

  describe('[GET] /admin/meals/balances', () => {
    let response: any;
    const year = '2024';
    const month = '10';

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get('/admin/meals/balances')
        .query({ year, month })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe(`어드민 ${month}월 식대 정산 조회 성공`);
    });

    it('형식이 올바르게 반환되는가?', async () => {
      expect(response.body.data.year).toBe(year);
      expect(response.body.data.month).toBe(month);

      const mealStats: MealStatsAdminInfo[] = response.body.data.mealStats;
      expect(mealStats.length).toBeGreaterThanOrEqual(0);

      if (mealStats.length > 0) {
        expect(mealStats[0]).toHaveProperty('mealStatsIdx');
        expect(mealStats[0]).toHaveProperty('userIdx');
        expect(mealStats[0]).toHaveProperty('userName');
        expect(mealStats[0]).toHaveProperty('gradeName');
        expect(mealStats[0]).toHaveProperty('mealBudget');
        expect(mealStats[0]).toHaveProperty('mealExpense');
        expect(mealStats[0]).toHaveProperty('mealBalance');
        expect(mealStats[0]).toHaveProperty('breakfastExpense');
        expect(mealStats[0]).toHaveProperty('dinnerExpense');
        expect(mealStats[0]).toHaveProperty('breakfastOverpay');
        expect(mealStats[0]).toHaveProperty('dinnerOverpay');
        expect(mealStats[0]).toHaveProperty('mealOverpay');
        expect(mealStats[0]).toHaveProperty('totalOverpay');
        expect(mealStats[0]).toHaveProperty('note');
        expect(mealStats[0]).toHaveProperty('clearStatus');
      }
    });

    it('mealBalance = mealBudget - mealExpense 가 성립하는가?', async () => {
      const { mealStats } = response.body.data;
      mealStats.forEach((stats: MealStatsAdminInfo) => {
        expect(stats.mealBalance).toEqual(stats.mealBudget - stats.mealExpense);
      });
    });

    it('totalOverpay가 알맞게 계산되었는가?', async () => {
      const mealStats: MealStatsAdminInfo[] = response.body.data.mealStats;
      if (mealStats.length > 0) {
        mealStats.forEach((stats: MealStatsAdminInfo) => {
          if (stats.mealBalance < 0) {
            expect(stats.totalOverpay).toBe(stats.breakfastOverpay + stats.dinnerOverpay + Math.abs(stats.mealBalance));
          } else {
            expect(stats.totalOverpay).toBe(stats.breakfastOverpay + stats.dinnerOverpay);
          }
        });
      }
    });

    // 추후 사용가능금액 = 기본금액 X 업무일 수... 검증로직 추가
  });

  describe('[GET] /admin/meals/balances/:mealStatsIdx', () => {
    let response: any;
    let mealStatsIdx: number = 2;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get(`/admin/meals/balances/${mealStatsIdx}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('success');
    });

    it('응답값이 targetDay 기준 오름차순으로 정렬되어 있는가?', () => {
      const data: MealEntity[] = response.body.data;
      const sortedData: MealEntity[] = data.sort((a: any, b: any) => a.targetDay - b.targetDay);
      expect(data).toEqual(sortedData);
    });

    it('존재하지 않는 Param에 대해 예외가 처리되는가?', async () => {
      mealStatsIdx = 9999999;
      response = await request(app.getHttpServer())
        .get(`/admin/meals/balances/${mealStatsIdx}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.message).toBe('해당 IDX에 대한 정보가 존재하지 않습니다.');
    });
  });
});
