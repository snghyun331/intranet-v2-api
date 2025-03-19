import { INestApplication } from '@nestjs/common';
import { closeTestApp, createTestAppWithCommute } from '../../../../test/appInit';
import * as request from 'supertest';
import { CheckInDto } from './dto/checkIn.dto';
import { IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum } from '../../../common/constant/enum';
import { LeaveDetailDto } from '../leave/dto/createLeave.dto';
import { CheckOutDto } from './dto/checkOut.dto';
import { LeaveRepository } from '../leave/repository/leave.repository';

describe('CommuteController(e2e)', () => {
  let app: INestApplication;
  let userAccessToken: string;
  let leaveRepository: LeaveRepository;

  beforeEach(async () => {
    ({ app, userAccessToken } = await createTestAppWithCommute());
    leaveRepository = app.get(LeaveRepository);
  });

  afterEach(async () => {
    if (app) {
      await closeTestApp(app);
    }
  });

  /**
   * ✅ 출근 요청 & 검증 함수
   */
  async function checkInAndVerify(
    checkInDto: CheckInDto,
    expectedAttendance: IntranetAttendanceEnum,
    commuteDate: string,
  ) {
    const postResponse = await request(app.getHttpServer())
      .post('/users/intranet/check-in')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send(checkInDto);

    expect(postResponse.body.message).toBe('success');

    const getResponse = await request(app.getHttpServer())
      .get('/users/intranet/commute')
      .query({ pageNo: 1, perPage: 1, sDate: commuteDate, eDate: commuteDate })
      .set('Authorization', `Bearer ${userAccessToken}`);

    const record = getResponse.body.data.records[0];
    expect(record).toBe('');
    // const record = getResponse.body.data.records[0];
    // expect(record.attendance).toBe(expectedAttendance);
  }

  /**
   * ✅ 퇴근 요청 & 검증 함수
   */
  async function checkOutAndVerify(
    checkOutDto: CheckOutDto,
    expectedAttendance: IntranetAttendanceEnum,
    commuteDate: string,
  ) {
    const postResponse = await request(app.getHttpServer())
      .put('/users/intranet/check-out')
      .set('Authorization', `Bearer ${userAccessToken}`)
      .send(checkOutDto);

    expect(postResponse.body.message).toBe('success');

    const getResponse = await request(app.getHttpServer())
      .get('/users/intranet/commute')
      .query({ pageNo: 1, perPage: 1, sDate: commuteDate, eDate: commuteDate })
      .set('Authorization', `Bearer ${userAccessToken}`);

    const record = getResponse.body.data.records[0];
    expect(record.attendance).toBe(expectedAttendance);
  }

  /**
   * ✅ 휴가 등록 함수
   */
  async function requestLeave(commuteDate: string, leaveTypeIdx: IntranetLeaveTypeIdxEnum) {
    const leaveDto: LeaveDetailDto = { commuteDate, leaveTypeIdx };
    const userIdx = 1;
    const note = null;

    await leaveRepository.createLeaveForE2ETest(leaveDto, userIdx, note);
  }

  /**
   * ✅ 테스트 케이스 작성
   */
  describe('Normal 출근 (지각X)', () => {
    let commuteDate: string;
    let checkInDto: CheckInDto;
    let checkOutDto: CheckOutDto;

    beforeEach(async () => {
      commuteDate = '2025-03-04';
      checkInDto = {
        checkInDeviceType: 'PC',
        checkInTime: new Date(`${commuteDate}T00:16:15.000Z`),
      };
      checkOutDto = {
        checkOutDeviceType: 'PC',
        checkOutTime: new Date(`${commuteDate}T09:18:15.000Z`),
        earlyLeaveReason: null,
      };
    });

    it("'정상 출근'으로 잘 표시되었는가?", async () => {
      console.log('@@@@@@@@@@@@@');
      console.log(checkInDto);
      await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN, commuteDate);
    });

    it("'정상 퇴근'으로 잘 표시되었는가?", async () => {
      console.log('%%%%%%%%%%%%%');
      console.log(checkOutDto);
      await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT, commuteDate);
    });
  });

  // describe('Normal 출근 (지각O)', () => {
  //   let commuteDate: string;
  //   let checkInDto: CheckInDto;
  //   let checkOutDto: CheckOutDto;

  //   beforeEach(async () => {
  //     commuteDate = '2025-03-05';
  //     checkInDto = {
  //       checkInDeviceType: 'PC',
  //       checkInTime: new Date(`${commuteDate}T10:16:15`),
  //     };
  //     checkOutDto = {
  //       checkOutDeviceType: 'PC',
  //       checkOutTime: new Date(`${commuteDate}T19:18:15`),
  //       earlyLeaveReason: null,
  //     };
  //   });

  //   it("'정상 출근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN_LATE, commuteDate);
  //   });

  //   it("'정상 퇴근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT_LATE, commuteDate);
  //   });
  // });

  // describe('오전 반차 출근 (지각O)', () => {
  //   let commuteDate: string;
  //   let checkInDto: CheckInDto;
  //   let checkOutDto: CheckOutDto;

  //   beforeEach(async () => {
  //     commuteDate = '2025-03-06';
  //     checkInDto = {
  //       checkInDeviceType: 'PC',
  //       checkInTime: new Date(`${commuteDate}T14:31:15`),
  //     };
  //     checkOutDto = {
  //       checkOutDeviceType: 'PC',
  //       checkOutTime: new Date(`${commuteDate}T18:50:15`),
  //       earlyLeaveReason: null,
  //     };
  //   });

  //   it('휴가가 정상적으로 등록되는가?', async () => {
  //     await requestLeave(commuteDate, IntranetLeaveTypeIdxEnum.AM_HALF);
  //   });

  //   it("'정상 출근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN_LATE, commuteDate);
  //   });

  //   it("'정상 퇴근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT_LATE, commuteDate);
  //   });
  // });

  // describe('오후 반차 출근 (지각O)', () => {
  //   let commuteDate: string;
  //   let checkInDto: CheckInDto;
  //   let checkOutDto: CheckOutDto;

  //   beforeEach(async () => {
  //     commuteDate = '2025-03-07';
  //     checkInDto = {
  //       checkInDeviceType: 'PC',
  //       checkInTime: new Date(`${commuteDate}T10:30:15`),
  //     };
  //     checkOutDto = {
  //       checkOutDeviceType: 'PC',
  //       checkOutTime: new Date(`${commuteDate}T14:30:15`),
  //       earlyLeaveReason: 'sfs',
  //     };
  //   });

  //   it('휴가가 정상적으로 등록되는가?', async () => {
  //     await requestLeave(commuteDate, IntranetLeaveTypeIdxEnum.PM_HALF);
  //   });

  //   it("'정상 출근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN_LATE, commuteDate);
  //   });

  //   it("'정상 퇴근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT_LATE, commuteDate);
  //   });
  // });

  // describe('오전 반반차 출근 (지각O)', () => {
  //   let commuteDate: string;
  //   let checkInDto: CheckInDto;
  //   let checkOutDto: CheckOutDto;

  //   beforeEach(async () => {
  //     commuteDate = '2025-03-10';
  //     checkInDto = {
  //       checkInDeviceType: 'PC',
  //       checkInTime: new Date(`${commuteDate}T11:16:15`),
  //     };
  //     checkOutDto = {
  //       checkOutDeviceType: 'PC',
  //       checkOutTime: new Date(`${commuteDate}T18:18:15`),
  //       earlyLeaveReason: null,
  //     };
  //   });

  //   it('휴가가 정상적으로 등록되는가?', async () => {
  //     await requestLeave(commuteDate, IntranetLeaveTypeIdxEnum.AM_QUARTER);
  //   });

  //   it("'정상 출근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN_LATE, commuteDate);
  //   });

  //   it("'정상 퇴근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT_LATE, commuteDate);
  //   });
  // });

  // describe('오후 반반차 출근 (지각O)', () => {
  //   let commuteDate: string;
  //   let checkInDto: CheckInDto;
  //   let checkOutDto: CheckOutDto;

  //   beforeEach(async () => {
  //     commuteDate = '2025-03-18';
  //     checkInDto = {
  //       checkInDeviceType: 'PC',
  //       checkInTime: new Date(`${commuteDate}T10:16:15`),
  //     };
  //     checkOutDto = {
  //       checkOutDeviceType: 'PC',
  //       checkOutTime: new Date(`${commuteDate}T17:19:15`),
  //       earlyLeaveReason: null,
  //     };
  //   });

  //   it('휴가가 정상적으로 등록되는가?', async () => {
  //     await requestLeave(commuteDate, IntranetLeaveTypeIdxEnum.PM_QUARTER);
  //   });

  //   it("'정상 출근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkInAndVerify(checkInDto, IntranetAttendanceEnum.CHECK_IN_LATE, commuteDate);
  //   });

  //   it("'정상 퇴근(지각)'으로 잘 표시되었는가?", async () => {
  //     await checkOutAndVerify(checkOutDto, IntranetAttendanceEnum.CHECK_OUT_LATE, commuteDate);
  //   });
  // });
});
