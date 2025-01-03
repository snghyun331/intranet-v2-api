import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestAppWithWelfare } from '../test-utility';
import { CreateWelfareBudgetDto } from '../../src/module/welfare/dto/createBudget.dto';
import { HalfYearEnum } from '../../src/common/constant/enum';
import { WelfareRepository } from '../../src/module/welfare/repository/welfare.repository';
import { WelfareBudgetAdminResult } from '../../src/module/welfare/interface/result.interface';
import { UpdateBudgetDto } from '../../src/module/welfare/dto/updateBudget.dto';

describe('AdminWelfareController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let welfareRepository: WelfareRepository;

  beforeAll(async () => {
    const result = await createTestAppWithWelfare();
    app = result.app;
    accessToken = result.adminAccessToken;
    welfareRepository = app.get(WelfareRepository);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('[POST] /admin/welfares/budget', () => {
    const createWelfareBudgetDto: CreateWelfareBudgetDto = {
      period: HalfYearEnum.H2,
      welfareBudget: 200000,
    };

    let response: any;
    const nowDate: Date = new Date();
    const nowYear: string = nowDate.getFullYear().toString();
    const month: string = createWelfareBudgetDto.period === HalfYearEnum.H1 ? '2' : '8';

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .post('/admin/welfares/budget')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createWelfareBudgetDto)
        .expect(201);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('어드민 복지포인트 설정 일괄 등록 및 수정 성공');
    });

    it('DB에 값이 제대로 들어갔는가? - welfareStats', async () => {
      const result: WelfareBudgetAdminResult[] = await welfareRepository.getAdminWelfareBudget(
        nowYear,
        createWelfareBudgetDto.period,
      );

      expect(result).toBeDefined();
      expect(result[0].welfareBudget).toBe(createWelfareBudgetDto.welfareBudget);
    });

    it('DB에 값이 제대로 들어갔는가? - welfareMonthlyStats', async () => {
      const userIdx = 1;
      const result: number = await welfareRepository.getWelfareMonthStatsCnt(userIdx, nowYear, month);

      expect(result).toBeGreaterThan(0);
    });
  });

  describe('[PATCH] /admin/welfares/budget/:welfareStatsIdx', () => {
    const updateBudgetDto: UpdateBudgetDto = {
      welfareBudget: 250000,
    };

    let response: any;

    beforeEach(async () => {
      response = await request(app.getHttpServer())
        .patch('/admin/welfares/budget/1')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateBudgetDto)
        .expect(200);
    });

    it('성공 메세지가 반환되는가?', async () => {
      expect(response.body.message).toBe('어드민 복지포인트 총 사용가능 금액 개별 수정 성공');
    });

    it('DB에 값이 제대로 수정되었는가?', async () => {
      const welfareStatsIdx = 1;
      const welfareBudget: number = await welfareRepository.getWelfareBudgetByIdx(welfareStatsIdx);
      expect(updateBudgetDto.welfareBudget).toBe(welfareBudget);
    });
  });
});
