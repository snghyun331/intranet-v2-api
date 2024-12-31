import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestAppWithWelfare } from '../test-utility';
import { Welfares, WelfareStats } from '../../src/module/welfare/interface/welfare.interface';
import { HalfYearEnum } from '../../src/common/constant/enum';

describe('UserWelfareController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const result = await createTestAppWithWelfare();
    app = result.app;
    accessToken = result.userAccessToken;
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('[GET] /users/welfares', () => {
    let response: any;
    const nowDate: Date = new Date();
    const nowYear: string = nowDate.getFullYear().toString();
    const nowMonth: number = nowDate.getMonth() + 1;
    const halfYear: HalfYearEnum = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;

    /* 200 */
    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .get('/users/welfares')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('복포 사용내역 조회 성공');
    });

    it('welfareStats가 올바르게 반환되는가?', async () => {
      const welfareStats: WelfareStats = response.body.data.welfareStats;
      expect(welfareStats).toBeDefined();

      // 길이가 0초과인 경우: 복포 설정 완료(=복포 통계 데이터 존재)
      if (Object.keys(welfareStats).length > 0) {
        expect(welfareStats.year).toBe(nowYear);
        expect(welfareStats.halfYear).toMatch(halfYear);
        expect(welfareStats.welfareBudget).toBeGreaterThan(0);
        expect(welfareStats.welfareExpense).toBeGreaterThanOrEqual(0);
        expect(typeof welfareStats.welfareBalance).toBe('number');
      }
    });

    it('welfareBalance = welfareBudget - welfareExpense 가 성립하는가?', async () => {
      const welfareStats: WelfareStats = response.body.data.welfareStats;
      expect(welfareStats).toBeDefined();

      // 길이가 0초과인 경우: 복포 설정 완료(=복포 통계 데이터 존재)
      if (Object.keys(welfareStats).length > 0) {
        const { welfareBudget, welfareExpense, welfareBalance } = welfareStats;
        expect(welfareBudget - welfareExpense).toEqual(welfareBalance);
      }
    });

    it('welfares 배열이 올바르게 반환되는가?', async () => {
      const welfares: Welfares[] = response.body.data.welfares;
      expect(welfares).toBeDefined();
      expect(Array.isArray(welfares)).toBe(true);
      expect(welfares.length).toBeGreaterThanOrEqual(0);

      if (welfares.length > 0) {
        welfares.forEach((welfare: Welfares) => {
          expect(welfare.welfareIdx).toBeGreaterThan(0);
          expect(welfare.userIdx).toBeGreaterThan(0);
          expect(welfare.targetDay).toMatch(/\d{4}-\d{2}-\d{2}/);
          expect(welfare.content).toBeDefined();
          expect(welfare.amount).toBeGreaterThanOrEqual(0);
          expect(welfare.payerName).toBeDefined();
          expect(welfare.selfWrittenYN).toMatch(/Y|N/);
          expect(['N', 'Y', 'H']).toContain(welfare.confirmYN);
          expect(Array.isArray(welfare.payeeList)).toBe(true);

          if (welfare.payeeList.length > 0) {
            welfare.payeeList.forEach((payee: any) => {
              expect(payee.userIdx).toBeGreaterThan(0);
              expect(payee.userName).toBeDefined();
              expect(payee.amount === null || payee.amount >= 0).toBe(true);
            });
          }
        });
      }
    });

    it('쿼리(month)를 알맞은 형식으로 입력했는가?', async () => {
      await request(app.getHttpServer())
        .get('/users/welfares')
        .query({ year: '2024', month: ['10', '11'] })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    /* 400 */
    it('쿼리에 연도 또는 월만 입력된 경우 예외가 처리되는가?', async () => {
      response = await request(app.getHttpServer())
        .get('/users/welfares')
        .query({ year: '2024' })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.message).toBe('연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다');
    });
  });
});
