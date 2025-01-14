import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateMealDto } from '../../src/module/meal/dto/createMeal.dto';
import { MealAttendanceEnum } from '../../src/common/constant/enum';
import { MealStats } from '../../src/module/meal/interface/meal.interface';
import { closeTestApp, createTestAppWithMeal } from '../test-utility';

describe('UserMealController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const result = await createTestAppWithMeal();
    app = result.app;
    accessToken = result.userAccessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('[POST] /users/meals', () => {
    const createMealDto: CreateMealDto = {
      targetDay: '2024-10-29',
      breakfast: { payerName: '', place: '', amount: null },
      lunch: { payerName: '이승현', place: '김가네', amount: 5000 },
      dinner: { payerName: '', place: '', amount: null },
      attendance: MealAttendanceEnum.WORKING,
    };

    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .post('/users/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createMealDto)
        .expect(201);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('식대 사용내역 저장 성공');
    });

    it('DB에 값이 제대로 들어갔는가?', async () => {
      const getResponse = await request(app.getHttpServer())
        .get('/users/meals')
        .query({ year: '2024', month: '10' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const savedMeal: any = getResponse.body.data.meals.find((meal: any) => meal.start === createMealDto.targetDay);

      expect(savedMeal).toBeDefined();
      expect(savedMeal.breakfast.payerName).toBe(createMealDto.breakfast.payerName);
      expect(savedMeal.breakfast.place).toBe(createMealDto.breakfast.place);
      expect(savedMeal.breakfast.amount).toBe(createMealDto.breakfast.amount);
      expect(savedMeal.lunch.payerName).toBe(createMealDto.lunch.payerName);
      expect(savedMeal.lunch.place).toBe(createMealDto.lunch.place);
      expect(savedMeal.lunch.amount).toBe(createMealDto.lunch.amount);
      expect(savedMeal.lunch.attendance).toBe(createMealDto.attendance);
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('식대 사용내역 조회 성공');
    });

    it('mealStats가 올바르게 반환되는가?', async () => {
      const mealStats: MealStats = response.body.data.mealStats;
      expect(mealStats).toBeDefined();
      expect(mealStats.year).toBe('2024');
      expect(mealStats.month).toBe('10');
      expect(mealStats.userName).toBe('이승현');
      expect(mealStats.mealBudget).toBeGreaterThan(0);
      expect(mealStats.mealExpense).toBeGreaterThanOrEqual(0);
      expect(typeof mealStats.mealBalance).toBe('number');
    });

    it('mealBalance = mealBudget - mealExpense 가 성립하는가?', async () => {
      const { mealBudget, mealExpense, mealBalance } = response.body.data.mealStats;
      expect(mealBudget - mealExpense).toEqual(mealBalance);
    });

    it('meals 배열이 올바르게 반환되는가?', () => {
      const meals: any = response.body.data.meals;
      expect(meals).toBeDefined();
      expect(Array.isArray(meals)).toBe(true);

      if (meals.length > 0) {
        meals.forEach((meal: any) => {
          expect(meal.start).toMatch(/2024-10-\d{2}/);
          expect(meal.holidayYN).toMatch(/Y|N/);
          expect(meal.breakfast).toBeDefined();
          expect(meal.breakfast).toHaveProperty('payerName');
          expect(meal.breakfast).toHaveProperty('place');
          expect(meal.breakfast).toHaveProperty('amount');
          expect(meal.lunch).toBeDefined();
          expect(meal.lunch).toHaveProperty('payerName');
          expect(meal.lunch).toHaveProperty('place');
          expect(meal.lunch).toHaveProperty('amount');
          expect(meal.lunch).toHaveProperty('attendance');
          expect(meal.dinner).toBeDefined();
          expect(meal.dinner).toHaveProperty('payerName');
          expect(meal.dinner).toHaveProperty('place');
          expect(meal.dinner).toHaveProperty('amount');
        });
      }
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
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('식대 사용내역 초기화 성공');
    });

    it('DB에서 값이 제대로 삭제되었는가?', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/meals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const deletedMeal: any = response.body.data.meals.find((meal: any) => meal.start === targetDay);
      expect(deletedMeal).toBeUndefined();
    });
  });
});
