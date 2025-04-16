import { INestApplication } from '@nestjs/common';
import { CreateMealDto } from './dto/createMeal.dto';
import * as request from 'supertest';
import { CreateMealBudgetDto } from './dto/createBudget.dto';
import { MealRepository } from './repository/meal.repository';
import { closeTestApp, createTestAppWithMeal } from '../../../test/appInit';

describe('MealController(e2e)', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let adminAccessToken: string;
  let mealRepository: MealRepository;

  beforeEach(async () => {
    ({ app, userAccessToken, adminAccessToken } = await createTestAppWithMeal());
    mealRepository = app.get(MealRepository);
  });

  afterEach(async () => {
    if (app) {
      await closeTestApp(app);
    }
  });

  /**
   * ✅ 테스트 케이스 작성
   */

  describe('[POST] /admin/meals/budget', () => {
    const createMealBudgetDto: CreateMealBudgetDto = {
      baseAmount: 10000,
      mealBudget: 23000,
      year: '2024',
      month: '10',
    };

    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .post('/admin/meals/budget')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createMealBudgetDto);
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
        .set('Authorization', `Bearer ${adminAccessToken}`);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe(`${month}월 어드민 식대 설정 리스트 조회 성공`);
    });
  });

  describe('[POST] /users/meals', () => {
    const createMealDto: CreateMealDto = {
      targetDay: '2024-10-29',
      breakfast: { payerName: '', place: '', amount: null },
      lunch: { payerName: '관리자', place: '김가네', amount: 5000 },
      dinner: { payerName: '', place: '', amount: null },
    };

    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .post('/users/meals')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(createMealDto);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('식대 사용내역 저장 성공');
    });

    it('DB에 값이 제대로 들어갔는가?', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/users/meals')
        .query({ year: '2024', month: '10' })
        .set('Authorization', `Bearer ${userAccessToken}`);

      const savedMeal: any = getResponse.body.data.meals.find((meal: any) => meal.start === createMealDto.targetDay);

      expect(savedMeal).toBeDefined();
      expect(savedMeal.breakfast.payerName).toBe(createMealDto.breakfast.payerName);
      expect(savedMeal.breakfast.place).toBe(createMealDto.breakfast.place);
      expect(savedMeal.breakfast.amount).toBe(createMealDto.breakfast.amount);
      expect(savedMeal.lunch.payerName).toBe(createMealDto.lunch.payerName);
      expect(savedMeal.lunch.place).toBe(createMealDto.lunch.place);
      expect(savedMeal.lunch.amount).toBe(createMealDto.lunch.amount);
      expect(savedMeal.dinner.payerName).toBe(createMealDto.dinner.payerName);
      expect(savedMeal.dinner.place).toBe(createMealDto.dinner.place);
      expect(savedMeal.dinner.amount).toBe(createMealDto.dinner.amount);
    });
  });

  describe('[GET] /users/meals', () => {
    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get('/users/meals')
        .query({ year: '2024', month: '10' })
        .set('Authorization', `Bearer ${userAccessToken}`);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('식대 사용내역 조회 성공');
    });

    it('mealBalance = mealBudget - mealExpense 가 성립하는가?', async () => {
      const { mealBudget, mealExpense, mealBalance } = response.body.data.mealStats;
      expect(typeof mealBalance).toBe('number');
      expect(mealBudget - mealExpense).toEqual(mealBalance);
    });

    it('meals 배열이 start 기준 오름차순으로 정렬되어 있는가?', () => {
      const meals: any = response.body.data.meals;
      const sortedMeals = meals.sort((a: any, b: any) => a.start - b.start);
      expect(meals).toEqual(sortedMeals);
    });
  });

  describe('[DELETE] /users/meals/:targetDay', () => {
    const targetDay: string = '2024-10-29';

    it('성공 메세지가 반환되는가?', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/meals/${targetDay}`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(response.body.message).toBe('식대 사용내역 초기화 성공');
    });

    it('DB에서 값이 제대로 삭제되었는가?', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/meals')
        .set('Authorization', `Bearer ${userAccessToken}`);

      const deletedMeal: any = response.body.data.meals.find((meal: any) => meal.start === targetDay);
      expect(deletedMeal).toBeUndefined();
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
        .set('Authorization', `Bearer ${adminAccessToken}`);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe(`어드민 ${month}월 식대 정산 조회 성공`);
    });

    it('mealBalance = mealBudget - mealExpense 가 성립하는가?', async () => {
      const { mealStats } = response.body.data;
      mealStats.forEach((stats: any) => {
        expect(typeof stats.mealBalance).toBe('number');
        expect(stats.mealBalance).toEqual(stats.mealBudget - stats.mealExpense);
      });
    });

    it('totalOverpay가 알맞게 계산되었는가?', async () => {
      const mealStats = response.body.data.mealStats;
      if (mealStats.length > 0) {
        mealStats.forEach((stats: any) => {
          if (stats.mealBalance < 0) {
            expect(stats.totalOverpay).toBe(stats.breakfastOverpay + stats.dinnerOverpay + Math.abs(stats.mealBalance));
          } else {
            expect(stats.totalOverpay).toBe(stats.breakfastOverpay + stats.dinnerOverpay);
          }
        });
      }
    });

    it('사용가능금액 = 기본금액 X (업무일수 + 휴일근무일수 - 휴무일)가 성립하는가?', async () => {
      const { mealStats } = response.body.data;
      const { baseAmount } = await mealRepository.getMealBaseInfo(year, month);
      mealStats.forEach((stats: any) => {
        expect(stats.mealBudget).toEqual(baseAmount * (stats.workdays + stats.holidayWorkdays - stats.timeoffDays));
      });
    });
  });

  describe('[GET] /admin/meals/balances/:mealStatsIdx', () => {
    let response: any;
    let mealStatsIdx: number = 1;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get(`/admin/meals/balances/${mealStatsIdx}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('success');
    });

    it('응답값이 targetDay 기준 오름차순으로 정렬되어 있는가?', () => {
      const data = response.body.data;
      const sortedData = data.sort((a: any, b: any) => a.targetDay - b.targetDay);
      expect(data).toEqual(sortedData);
    });

    it('존재하지 않는 Param에 대해 예외가 처리되는가?', async () => {
      mealStatsIdx = 9999999;
      response = await request(app.getHttpServer())
        .get(`/admin/meals/balances/${mealStatsIdx}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.body.message).toBe('해당 IDX에 대한 정보가 존재하지 않습니다.');
    });
  });
});
