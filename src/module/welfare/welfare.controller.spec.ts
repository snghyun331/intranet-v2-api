import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { closeTestApp, createTestAppWithWelfare } from '../../../test/appInit';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { HalfYearEnum, YNEnum } from '../../common/constant/enum';
import { CreateWelfareBudgetDto } from './dto/createBudget.dto';

describe('WelfareController(e2e)', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let adminAccessToken: string;

  beforeEach(async () => {
    ({ app, userAccessToken, adminAccessToken } = await createTestAppWithWelfare());
  });

  afterEach(async () => {
    if (app) {
      await closeTestApp(app);
    }
  });

  /**
   * ✅ 복포 등록 함수
   */
  async function createNewWelfare(newWelfareInfo: CreateWelfareDto) {
    const postResponse = await request(app.getHttpServer())
      .post('/users/welfares')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send(newWelfareInfo);

    expect(postResponse.body.message).toBe('복지포인트 사용내역 저장 성공');
  }

  /**
   * ✅ 테스트 케이스 작성
   */
  describe('어드민 복포 일괄 설정', () => {
    it('에러 없이 잘 등록되는가?', async () => {
      const createWelfareBudgetDto: CreateWelfareBudgetDto = {
        year: '2025',
        period: HalfYearEnum.H1,
        welfareBudget: 200000,
      };

      const response = await request(app.getHttpServer())
        .post('/admin/welfares/budget')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(createWelfareBudgetDto);

      expect(response.body.message).toBe('어드민 복지포인트 설정 일괄 등록 및 수정 성공');
    });
  });

  describe('복포 등록 - 본인 카드로 단독 결제', () => {
    const newWelfareInfo: CreateWelfareDto = {
      targetDay: '2025-04-01',
      amount: 3900,
      content: '메가커피',
      payerName: '관리자',
      payeeIdxs: [],
      selfWrittenYN: YNEnum.YES,
    };
    it('성공?', async () => {});
  });

  describe('복포 등록 - 본인 카드로 여러명 결제', () => {
    const newWelfareInfo: CreateWelfareDto = {
      targetDay: '2025-04-01',
      amount: 3900,
      content: '메가커피',
      payerName: '관리자',
      payeeIdxs: [2],
      selfWrittenYN: YNEnum.YES,
    };
    it('성공?', async () => {});
  });

  describe('복포 조회 - 단독 검증', () => {
    it('본인의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});
  });

  describe('복포 조회 - 여러명 검증', () => {
    it('본인의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('동반 결제자의 내역의 amount는 null값으로 저장되었는가?', async () => {});
  });

  describe('복포 삭제', () => {
    // 동반 결제자 있는 내역으로 테스트
    it('본인의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('본인의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});

    it('동반 결제자의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('동반 결제자의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
    it('동반 결제자의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});
  });

  describe('복포 수정', () => {
    describe('본인의 사용금액 수정', () => {
      it('본인의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
      it('본인의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
      it('본인의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});
    });

    describe('동반결제자 수정(삭제 및 추가 등록)', () => {
      it('삭제된 동반 결제자)의 월별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
      it('삭제된 동반 결제자)의 반기별 복포 사용금액이 잘 업데이트 되었는가?', async () => {});
      it('삭제된 동반 결제자)의 반기별 잔여 사용금액이 잘 업데이트 되었는가?', async () => {});

      it('추가된 동반 결제자의 amount는 null값으로 저장되었는가?', async () => {});
    });
  });
});
