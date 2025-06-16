import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { CheckInDto } from './dto/checkIn.dto';
import { CheckOutDto } from './dto/checkOut.dto';
import {
  FULL_DAY_REST_LISTS,
  PARTIAL_DAY_REST_LISTS,
  PM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  PM_REST_LISTS,
  AM_QUARTER_REST_LISTS,
} from '@common/constant/constant';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { ConfirmEnum, IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum } from '@common/constant/enum';
import {
  calculateCombinedCommuteAvailCheckOutTime,
  calculateCombinedLeaveStandardWorkingMinutes,
  calculateSingleCommuteAvailCheckOutTime,
  calculateSingleLeaveStandardWorkingMinutes,
  getAmHalfEarlyBoundary,
  getAmHalfLateBoundary,
  getAmQuarterEarlyBoundary,
  getAmQuarterLateBoundary,
  getNormalEarlyBoundary,
  getNormalLateBoundary,
  getPmHalfLateBoundary,
  getStartAndEndDateByMonth,
} from '@common/utils/utility';
import { UpdateCommuteTimeDto } from './dto/updateCommuteTime.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { Transactional } from 'typeorm-transactional';
import { InsertCheckInInfo, UpdateCheckInInfo, UpdateCheckOutInfo, UpdateCommuteTimeInfo } from './interface';
import { GlobalUserRepository } from '@global/repository/globalUser.repository';
import { GlobalHolidayRepository } from '@global/repository/globalHoliday.repository';
import { LeaveService } from '../leave/leave.service';
import { LastUpdated } from './interface/commute.interface';

@Injectable()
export class CommuteService {
  constructor(
    private readonly commuteRepository: CommuteRepository,
    private readonly leaveService: LeaveService,
    private readonly userRepository: GlobalUserRepository,
    private readonly holidayRepository: GlobalHolidayRepository,
  ) {}

  @Transactional()
  async checkInWork(
    userIdx: number,
    checkInDto: CheckInDto,
    checkInLogAgent: string,
    checkInIpAddr: string,
  ): Promise<void> {
    /**
     * ✅ 정상: 스케줄러로 당일 전 직원 근태가 생성되어있음
     * ❌ 비정상: 서버 장애 등으로 스케줄러 미실행되어 근태 데이터 누락
     */

    const commuteDate: string = moment(checkInDto.checkInTime).utcOffset(9).format('YYYY-MM-DD');
    const isBirthday: boolean = await this.userRepository.isBirthday(userIdx, commuteDate); // 생일여부 확인

    /* 오전 6시 ~ 오전 8시는 현장 근무, 오전 6시 이전은 출근 불가 */
    const checkInHour: number = new Date(checkInDto.checkInTime).getHours();
    if (checkInHour < 6) {
      throw new BadRequestException('출근은 오전 6시 이후부터 가능합니다.');
    }

    /* 오늘의 출근 정보가 있는지 확인 */
    const commuteInfoList = await this.commuteRepository.getAllCommuteInfoByDate(userIdx, commuteDate);
    // 이미 출근이 등록된 내역이 있는지 확인
    const hasCheckedIn: boolean = commuteInfoList.some((info: any) => info.checkInTime);
    if (hasCheckedIn) {
      throw new BadRequestException('이미 출근이 등록되었습니다.');
    }
    // 반려내역 있으면 삭제
    await Promise.all(
      commuteInfoList.map(async (commuteInfo) => {
        if (commuteInfo.confirmYN === ConfirmEnum.REJECT) {
          await this.commuteRepository.deleteCommute(commuteInfo.commuteIdx);
        }
      }),
    );
    const confirmedCommuteInfoList = commuteInfoList.filter((info) => info.confirmYN === ConfirmEnum.YES); // 승인된 휴가 추출
    const normalCommuteInfoList = commuteInfoList.filter((info) => info.confirmYN === ConfirmEnum.NO);

    if (confirmedCommuteInfoList.length === 2) {
      /* 조합휴가 케이스 (2개 휴가) */
      await this.handleCombinedLeaveCheckIn(
        confirmedCommuteInfoList,
        checkInDto,
        checkInLogAgent,
        checkInIpAddr,
        userIdx,
        commuteDate,
        isBirthday,
        checkInHour,
      );
    } else if (confirmedCommuteInfoList.length === 1) {
      /* 단일 내역 케이스 (1개) */
      await this.handleSingleCommuteCheckIn(
        confirmedCommuteInfoList[0],
        checkInDto,
        checkInLogAgent,
        checkInIpAddr,
        userIdx,
        commuteDate,
        isBirthday,
        checkInHour,
      );
    } else {
      /* 미승인 케이스 (일반근무 포함) */
      await this.handleNormalCommuteCheckIn(
        normalCommuteInfoList,
        checkInDto,
        checkInLogAgent,
        checkInIpAddr,
        userIdx,
        commuteDate,
        isBirthday,
        checkInHour,
      );
    }
  }

  private async handleCombinedLeaveCheckIn(
    commuteInfoList: any[],
    checkInDto: CheckInDto,
    checkInLogAgent: string,
    checkInIpAddr: string,
    userIdx: number,
    commuteDate: string,
    isBirthday: boolean,
    checkInHour: number,
  ) {
    /* 근태 상태가 휴무인지 확인 */
    const firstLeaveReduceUnit: number = commuteInfoList[0].leaveReduceUnit;
    const secondLeaveReduceUnit: number = commuteInfoList[1].leaveReduceUnit;
    if (firstLeaveReduceUnit + secondLeaveReduceUnit === 1.0) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }
    const { attendance, availCheckOutTime } = await this.calculateCombinedLeaveAttendance(
      commuteInfoList,
      checkInDto.checkInTime,
      isBirthday,
      checkInHour,
    );

    const updateCheckInInfo: UpdateCheckInInfo = {
      ...checkInDto,
      attendance,
      commuteDate,
      checkInIpAddr,
      checkInLogAgent,
      availCheckOutTime,
    };

    await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
  }

  private async handleSingleCommuteCheckIn(
    commuteInfo: any,
    checkInDto: CheckInDto,
    checkInLogAgent: string,
    checkInIpAddr: string,
    userIdx: number,
    commuteDate: string,
    isBirthday: boolean,
    checkInHour: number,
  ): Promise<void> {
    /* 근태 상태가 휴무인지 확인 */
    if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }

    /* 근태가 반/반반차 일 경우 */
    if (PARTIAL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
      const { attendance, availCheckOutTime } = await this.calculateSingleLeaveAttendance(
        commuteInfo.leaveTypeIdx,
        checkInDto.checkInTime,
        isBirthday,
        checkInHour,
      );

      const updateCheckInInfo: UpdateCheckInInfo = {
        ...checkInDto,
        attendance,
        commuteDate,
        checkInIpAddr,
        checkInLogAgent,
        availCheckOutTime,
      };

      /* 근태 업데이트 */
      await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);

      return;
    }
  }

  private async handleNormalCommuteCheckIn(
    commuteInfoList: any[],
    checkInDto: CheckInDto,
    checkInLogAgent: string,
    checkInIpAddr: string,
    userIdx: number,
    commuteDate: string,
    isBirthday: boolean,
    checkInHour: number,
  ): Promise<void> {
    const { attendance, availCheckOutTime } = await this.calculateNormalAttendance(
      checkInDto.checkInTime,
      isBirthday,
      checkInHour,
    );

    /* commuteInfo가 없는 경우: '일반 근무'로 간주
     * - 반려 처리되었거나
     * - 스케줄러에서 처리되지 않은 예외 상황
     */
    if (commuteInfoList.length === 0) {
      const insertCheckInInfo: InsertCheckInInfo = {
        ...checkInDto,
        attendance,
        commuteDate,
        checkInIpAddr,
        checkInLogAgent,
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
        availCheckOutTime,
        firstUpdatedAt: new Date(),
      };

      /* 근태 생성 */
      await this.commuteRepository.createCheckInWork(userIdx, insertCheckInInfo);
    } else {
      const updateCheckInInfo: UpdateCheckInInfo = {
        ...checkInDto,
        attendance,
        commuteDate,
        checkInIpAddr,
        checkInLogAgent,
        availCheckOutTime,
      };

      /* 근태 업데이트 */
      await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
    }
  }

  /**
   * 조합휴가 지각 판별 & 퇴근가능시간 계산
   */
  private async calculateCombinedLeaveAttendance(
    commuteInfoList: any[],
    checkInTime: Date,
    isBirthday: boolean,
    checkInHour: number,
  ) {
    const isAmQuarterLate = new Date(checkInTime) >= getAmQuarterLateBoundary(new Date(checkInTime));
    const attendance = isAmQuarterLate
      ? IntranetAttendanceEnum.CHECK_IN_LATE
      : checkInHour >= 6 && checkInHour < 8
        ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
        : IntranetAttendanceEnum.CHECK_IN;

    const availCheckOutTime = calculateCombinedCommuteAvailCheckOutTime(
      checkInTime,
      commuteInfoList[0].leaveTypeIdx,
      commuteInfoList[1].leaveTypeIdx,
      isBirthday,
    );

    return { attendance, availCheckOutTime };
  }

  /**
   * 반차/반반차 지각 판별
   */
  private async calculateSingleLeaveAttendance(
    leaveTypeIdx: number,
    checkInTime: Date,
    isBirthday: boolean,
    checkInHour: number,
  ) {
    const isPmQuarterLate =
      PM_QUARTER_REST_LISTS.has(leaveTypeIdx) && new Date(checkInTime) >= getNormalLateBoundary(new Date(checkInTime));

    const isAmHalfLate =
      AM_REST_LISTS.has(leaveTypeIdx) && new Date(checkInTime) >= getAmHalfLateBoundary(new Date(checkInTime));

    const isPMHalfLate =
      PM_REST_LISTS.has(leaveTypeIdx) && new Date(checkInTime) >= getPmHalfLateBoundary(new Date(checkInTime));

    const isAmQuarterLate =
      AM_QUARTER_REST_LISTS.has(leaveTypeIdx) &&
      new Date(checkInTime) >= getAmQuarterLateBoundary(new Date(checkInTime));

    const attendance =
      isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
        ? IntranetAttendanceEnum.CHECK_IN_LATE
        : checkInHour >= 6 && checkInHour < 8
          ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
          : IntranetAttendanceEnum.CHECK_IN;

    const availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(checkInTime, leaveTypeIdx, isBirthday);

    return { attendance, availCheckOutTime };
  }

  /**
   * 일반 근무 지각 판별
   */
  private async calculateNormalAttendance(checkInTime: Date, isBirthday: boolean, checkInHour: number) {
    const isNormalLate = new Date(checkInTime) >= getNormalLateBoundary(new Date(checkInTime));

    const attendance = isNormalLate
      ? IntranetAttendanceEnum.CHECK_IN_LATE
      : checkInHour >= 6 && checkInHour < 8
        ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
        : IntranetAttendanceEnum.CHECK_IN;

    const availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(
      checkInTime,
      IntranetLeaveTypeIdxEnum.NORMAL,
      isBirthday,
    );

    return { attendance, availCheckOutTime };
  }

  @Transactional()
  async checkOutWork(
    userIdx: number,
    checkOutDto: CheckOutDto,
    checkOutIpAddr: string,
    checkOutLogAgent: string,
  ): Promise<void> {
    /* 근태날짜 설정
     *  오전 0시 ~ 오전6시 : '야근 후 퇴근'으로 간주
     *  오전 6시 이후 : '당일 퇴근'으로 간주
     */
    let commuteDate: string;
    const checkOutMoment = moment(checkOutDto.checkOutTime).utcOffset(9);
    const currentHour: number = checkOutMoment.hour();
    if (currentHour >= 0 && currentHour < 6) {
      commuteDate = checkOutMoment.subtract(1, 'day').format('YYYY-MM-DD'); // 전날을 근태날짜로 설정
    } else {
      commuteDate = checkOutMoment.format('YYYY-MM-DD');
    }

    /* 오늘의 출근 정보가 있는지 확인 */
    const commuteInfoList = await this.commuteRepository.getCommuteInfoByDate(userIdx, commuteDate);
    if (commuteInfoList.length === 0 || !commuteInfoList[0].checkInTime) {
      throw new BadRequestException('출근을 먼저 등록해주세요');
    }
    if (commuteInfoList[0].checkOutTime) {
      throw new BadRequestException('이미 퇴근을 찍었습니다.');
    }
    const confirmedCommuteInfoList = commuteInfoList.filter((info) => info.confirmYN === ConfirmEnum.YES); // 승인된 휴가 추출
    const normalCommuteInfoList = commuteInfoList.filter((info) => info.confirmYN === ConfirmEnum.NO);
    if (confirmedCommuteInfoList.length === 2) {
      /* 조합휴가 케이스 (2개 휴가) */
      await this.handleCombinedLeaveCheckOut(
        confirmedCommuteInfoList,
        checkOutDto,
        checkOutLogAgent,
        checkOutIpAddr,
        userIdx,
        commuteDate,
      );
    } else if (confirmedCommuteInfoList.length === 1) {
      /* 단일 내역 케이스 (1개) */
      await this.handleSingleCommuteCheckOut(
        confirmedCommuteInfoList[0],
        checkOutDto,
        checkOutLogAgent,
        checkOutIpAddr,
        userIdx,
        commuteDate,
      );
    } else {
      /* 미승인 케이스 (일반 근무 포함) */
      await this.handleNormalCommuteCheckOut(
        normalCommuteInfoList,
        checkOutDto,
        checkOutLogAgent,
        checkOutIpAddr,
        userIdx,
        commuteDate,
      );
    }
  }

  private async handleCombinedLeaveCheckOut(
    commuteInfoList: any[],
    checkOutDto: CheckOutDto,
    checkOutLogAgent: string,
    checkOutIpAddr: string,
    userIdx: number,
    commuteDate: string,
  ) {
    /* 근태 상태가 휴무인지 확인 */
    const firstLeaveReduceUnit: number = commuteInfoList[0].leaveReduceUnit;
    const secondLeaveReduceUnit: number = commuteInfoList[1].leaveReduceUnit;
    if (firstLeaveReduceUnit + secondLeaveReduceUnit === 1.0) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }

    // 조합휴가는 반드시 반반차+반반차 조합이다.
    const commuteInfo = commuteInfoList[0];

    /* 출근가능시간보다 일찍 찍은 경우, 출근시간은 출근가능시간으로 처리된다. */
    let finalCheckInTime: Date;
    if (commuteInfo.checkInTime < getAmQuarterEarlyBoundary(new Date(commuteInfo.checkInTime))) {
      finalCheckInTime = getAmQuarterEarlyBoundary(new Date(commuteInfo.checkInTime));
    } else {
      finalCheckInTime = new Date(commuteInfo.checkInTime);
    }
    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);
    const finalAvailCheckOutTime: Date = new Date(commuteInfo.availCheckOutTime);
    const workingMinutes: number = (finalCheckOutTime.getTime() - finalCheckInTime.getTime()) / (1000 * 60);

    // 초과근무시간이 음수이면, 0분으로 통일
    const overtimeWorkingMinutes: number = Math.max(
      0,
      (finalCheckOutTime.getTime() - finalAvailCheckOutTime.getTime()) / (1000 * 60),
    );

    /* 최종 근무시간이 기준시간 미만이면 사유를 필수 입력 */
    if (finalCheckOutTime < finalAvailCheckOutTime && !checkOutDto.earlyLeaveReason) {
      throw new BadRequestException('조기퇴근 시, 사유 입력은 필수입니다.');
    }

    /* 근태 상태 설정 */
    let attendance: IntranetAttendanceEnum;
    if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
          : IntranetAttendanceEnum.CHECK_OUT_LATE;
    } else if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_ON_SITE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_ON_SITE
          : IntranetAttendanceEnum.CHECK_OUT_ON_SITE;
    } else {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT
          : IntranetAttendanceEnum.CHECK_OUT;
    }

    const updateCheckOutInfo: UpdateCheckOutInfo = {
      commuteDate,
      ...checkOutDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkOutIpAddr,
      checkOutLogAgent,
      attendance,
    };

    await this.commuteRepository.checkOutWork(userIdx, updateCheckOutInfo);

    return;
  }

  private async handleSingleCommuteCheckOut(
    commuteInfo: any,
    checkOutDto: CheckOutDto,
    checkOutLogAgent: string,
    checkOutIpAddr: string,
    userIdx: number,
    commuteDate: string,
  ) {
    /* 근태 상태가 휴무인지 확인 */
    if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }
    const { checkInTime, leaveTypeIdx } = commuteInfo;

    /* 출근가능시간보다 일찍 찍은 경우, 출근시간은 출근가능시간으로 처리된다. */
    let finalCheckInTime: Date;
    if (AM_REST_LISTS.has(leaveTypeIdx) && checkInTime < getAmHalfEarlyBoundary(new Date(checkInTime))) {
      finalCheckInTime = getAmHalfEarlyBoundary(new Date(checkInTime));
    } else if (
      AM_QUARTER_REST_LISTS.has(leaveTypeIdx) &&
      checkInTime < getAmQuarterEarlyBoundary(new Date(checkInTime))
    ) {
      finalCheckInTime = getAmQuarterEarlyBoundary(new Date(checkInTime));
    } else if (
      // leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL ||
      (leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_HALF || leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_QUARTER) &&
      checkInTime < getNormalEarlyBoundary(new Date(checkInTime))
    ) {
      finalCheckInTime = getNormalEarlyBoundary(new Date(checkInTime));
    } else {
      finalCheckInTime = new Date(checkInTime);
    }

    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);
    const finalAvailCheckOutTime: Date = new Date(commuteInfo.availCheckOutTime);
    const workingMinutes: number = (finalCheckOutTime.getTime() - finalCheckInTime.getTime()) / (1000 * 60);
    // 초과근무시간이 음수이면, 0분으로 통일
    const overtimeWorkingMinutes: number = Math.max(
      0,
      (finalCheckOutTime.getTime() - finalAvailCheckOutTime.getTime()) / (1000 * 60),
    );

    /* 최종 근무시간이 기준시간 미만이면 사유를 필수 입력 */
    if (finalCheckOutTime < finalAvailCheckOutTime && !checkOutDto.earlyLeaveReason) {
      throw new BadRequestException('조기퇴근 시, 사유 입력은 필수입니다.');
    }

    /* 근태 상태 설정 */
    let attendance: IntranetAttendanceEnum;
    if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
          : IntranetAttendanceEnum.CHECK_OUT_LATE;
    } else if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_ON_SITE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_ON_SITE
          : IntranetAttendanceEnum.CHECK_OUT_ON_SITE;
    } else {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT
          : IntranetAttendanceEnum.CHECK_OUT;
    }

    const updateCheckOutInfo: UpdateCheckOutInfo = {
      commuteDate,
      ...checkOutDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkOutIpAddr,
      checkOutLogAgent,
      attendance,
    };

    await this.commuteRepository.checkOutWork(userIdx, updateCheckOutInfo);

    return;
  }

  private async handleNormalCommuteCheckOut(
    commuteInfoList: any[],
    checkOutDto: CheckOutDto,
    checkOutLogAgent: string,
    checkOutIpAddr: string,
    userIdx: number,
    commuteDate: string,
  ) {
    const commuteInfo = commuteInfoList[0];
    let finalCheckInTime: Date;
    /* 출근가능시간보다 일찍 찍은 경우, 출근시간은 출근가능시간으로 처리된다. */
    if (commuteInfo.checkInTime < getNormalEarlyBoundary(new Date(commuteInfo.checkInTime))) {
      finalCheckInTime = getNormalEarlyBoundary(new Date(commuteInfo.checkInTime));
    } else {
      finalCheckInTime = new Date(commuteInfo.checkInTime);
    }

    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);
    const finalAvailCheckOutTime: Date = new Date(commuteInfo.availCheckOutTime);
    const workingMinutes: number = (finalCheckOutTime.getTime() - finalCheckInTime.getTime()) / (1000 * 60);
    // 초과근무시간이 음수이면, 0분으로 통일
    const overtimeWorkingMinutes: number = Math.max(
      0,
      (finalCheckOutTime.getTime() - finalAvailCheckOutTime.getTime()) / (1000 * 60),
    );

    /* 최종 근무시간이 기준시간 미만이면 사유를 필수 입력 */
    if (finalCheckOutTime < finalAvailCheckOutTime && !checkOutDto.earlyLeaveReason) {
      throw new BadRequestException('조기퇴근 시, 사유 입력은 필수입니다.');
    }

    /* 근태 상태 설정 */
    let attendance: IntranetAttendanceEnum;
    if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
          : IntranetAttendanceEnum.CHECK_OUT_LATE;
    } else if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_ON_SITE) {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_ON_SITE
          : IntranetAttendanceEnum.CHECK_OUT_ON_SITE;
    } else {
      attendance =
        finalCheckOutTime < finalAvailCheckOutTime
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT
          : IntranetAttendanceEnum.CHECK_OUT;
    }

    const updateCheckOutInfo: UpdateCheckOutInfo = {
      commuteDate,
      ...checkOutDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkOutIpAddr,
      checkOutLogAgent,
      attendance,
    };

    await this.commuteRepository.checkOutWork(userIdx, updateCheckOutInfo);

    return;
  }

  async getCommuteRecords({ pageNo, perPage }: PageNoDto, filterInfo: AdminCommuteFilterDto) {
    const { totalPage, total, results } = await this.commuteRepository.getCommuteRecords(pageNo, perPage, filterInfo);

    // 날짜별 + 사용자별로 그룹핑
    const groupedByDateAndUser = results.reduce((acc, result) => {
      const dateKey = result.commuteDate;
      const userKey = result.userIdx;
      const compositeKey = `${dateKey}_${userKey}`;

      if (!acc[compositeKey]) {
        // confirmYN, leaveType, leaveTypeIdx 제외
        const { confirmYN, leaveType, leaveTypeIdx, lastUpdatedAt, ...cleanResult } = result;
        acc[compositeKey] = {
          ...cleanResult,
          lastUpdatedAt: JSON.parse(lastUpdatedAt),
          leave: [],
        };
      }

      // leave 정보가 있으면 추가
      if (result.leaveTypeIdx && result.leaveType) {
        acc[compositeKey].leave.push({
          commuteIdx: result.commuteIdx,
          leaveTypeIdx: result.leaveTypeIdx,
          leaveType: result.leaveType,
          confirmYN: result.confirmYN,
        });
      }

      return acc;
    }, {});

    // 객체를 배열로 변환
    const records = Object.values(groupedByDateAndUser);

    return { totalPage, total, records };
  }

  async getUserCommuteRecords(userIdx: number, { pageNo, perPage }: PageNoDto, filterInfo: UserCommuteFilterDto) {
    // 마감 날짜가 현재 날짜보다 미래라면, 현재 날짜까지 조회
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    if (filterInfo.eDate > nowDate) {
      filterInfo.eDate = nowDate;
    }

    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt === 0) {
      throw new NotFoundException('해당 사용자는 존재하지 않습니다.');
    }

    const { totalPage, total, results } = await this.commuteRepository.getUserCommuteRecords(
      userIdx,
      pageNo,
      perPage,
      filterInfo,
    );

    // 날짜별로 그룹핑
    const groupedByDate = results.reduce((acc, result) => {
      const dateKey = result.commuteDate;

      if (!acc[dateKey]) {
        acc[dateKey] = {
          ...result,
          leave: [],
        };
      }

      // leave 정보가 있으면 추가
      if (result.leaveTypeIdx && result.leaveType) {
        acc[dateKey].leave.push({
          commuteIdx: result.commuteIdx,
          leaveTypeIdx: result.leaveTypeIdx,
          leaveType: result.leaveType,
          confirmYN: result.confirmYN,
        });
      }

      return acc;
    }, {});

    // 객체를 배열로 변환
    const dateKeys = Object.keys(groupedByDate);

    const records = await Promise.all(
      dateKeys.map(async (dateKey) => {
        const record = groupedByDate[dateKey];

        // 중복된 leave 항목 제거
        const uniqueLeaves = [];
        const seenLeaveTypeIdx = new Set();

        for (const leave of record.leave) {
          if (!seenLeaveTypeIdx.has(leave.leaveTypeIdx)) {
            uniqueLeaves.push(leave);
            seenLeaveTypeIdx.add(leave.leaveTypeIdx);
          }
        }

        // 최종 결과 반환
        return {
          commuteIdx: record.commuteIdx,
          userIdx: record.userIdx,
          commuteDate: record.commuteDate,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          workingMinutes: record.workingMinutes,
          overtimeWorkingMinutes: record.overtimeWorkingMinutes,
          attendance: record.attendance,
          updateReason: record.updateReason,
          earlyLeaveReason: record.earlyLeaveReason,
          note: record.note,
          checkInIpAddr: record.checkInIpAddr,
          checkOutIpAddr: record.checkOutIpAddr,
          checkInLogAgent: record.checkInLogAgent,
          checkOutLogAgent: record.checkOutLogAgent,
          adminUpdatedAt: record.adminUpdatedAt,
          leave: uniqueLeaves,
        };
      }),
    );

    return { totalPage, total, records };
  }

  @Transactional()
  async deleteUserCommuteRecord(commuteIdxList: number[]): Promise<void> {
    for (const commuteIdx of commuteIdxList) {
      const commuteCnt: number = await this.commuteRepository.getCommuteCountByIdx(commuteIdx);
      if (commuteCnt === 0) {
        throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
      }

      await this.leaveService.deleteLeave(commuteIdx);
    }
  }

  @Transactional()
  async updateCommuteTime(commuteIdx: number, updateDto: UpdateCommuteTimeDto): Promise<void> {
    const commuteInfo = await this.commuteRepository.getCommuteInfoByIdx(commuteIdx);
    if (!commuteInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (!updateDto.checkInTime && updateDto.checkOutTime) {
      throw new BadRequestException('출근 시간이 비어있어 퇴근 시간을 저장할 수 없습니다.');
    }

    let availCheckOutTime: Date;
    let attendance: IntranetAttendanceEnum;
    let workingMinutes: number | null;
    let overtimeWorkingMinutes: number | null;

    const allValidCommutesByDate = await this.commuteRepository.getValidCommuteInfoByDate(
      commuteInfo.userIdx,
      commuteInfo.commuteDate,
    );

    /* 출근 시간 및 퇴근 시간 null일 경우, */
    if (!updateDto.checkInTime && !updateDto.checkOutTime) {
      availCheckOutTime = null;
      attendance = null;
      workingMinutes = null;
      overtimeWorkingMinutes = null;

      await Promise.all(
        allValidCommutesByDate.map(async (commute) => {
          const leaveTypeIdx = commute.leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL ? null : commute.leaveTypeIdx;
          const updateInfo: UpdateCommuteTimeInfo = {
            ...updateDto,
            workingMinutes,
            overtimeWorkingMinutes,
            availCheckOutTime,
            attendance,
            leaveTypeIdx,
            adminUpdatedAt: new Date(),
          };
          await this.commuteRepository.updateCommuteTime(commute.commuteIdx, updateInfo);
        }),
      );

      return;
    }

    const approvedCommuteInfoList = allValidCommutesByDate.filter((info) => info.confirmYN === ConfirmEnum.YES); // 승인된 휴가 추출
    const isBirthday: boolean = await this.userRepository.isBirthday(commuteInfo.userIdx, commuteInfo.commuteDate); // 생일여부 확인

    if (approvedCommuteInfoList.length === 2) {
      /* 조합휴가 케이스 (2개 휴가) */
      // 퇴근가능시간 계산
      availCheckOutTime = calculateCombinedCommuteAvailCheckOutTime(
        updateDto.checkInTime,
        approvedCommuteInfoList[0].leaveTypeIdx,
        approvedCommuteInfoList[1].leaveTypeIdx,
        isBirthday,
      );

      // 지각 판별
      const isAmQuarterLate =
        new Date(updateDto.checkInTime) >= getAmQuarterLateBoundary(new Date(updateDto.checkInTime));

      if (!updateDto.checkOutTime) {
        // 근무시간 계산
        workingMinutes = null;
        overtimeWorkingMinutes = null;
        // 근태 계산
        attendance = isAmQuarterLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
      } else {
        // 근무시간 계산
        workingMinutes = (updateDto.checkOutTime.getTime() - updateDto.checkInTime.getTime()) / (1000 * 60);
        const standardWorkingMinutes = calculateCombinedLeaveStandardWorkingMinutes(
          approvedCommuteInfoList[0].leaveTypeIdx,
          approvedCommuteInfoList[1].leaveTypeIdx,
          isBirthday,
        );
        overtimeWorkingMinutes =
          workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;
        // 근태 계산
        const checkInAttendance = isAmQuarterLate
          ? IntranetAttendanceEnum.CHECK_IN_LATE
          : IntranetAttendanceEnum.CHECK_IN;
        if (checkInAttendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
              : IntranetAttendanceEnum.CHECK_OUT_LATE;
        } else {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT
              : IntranetAttendanceEnum.CHECK_OUT;
        }
      }
    } else if (approvedCommuteInfoList.length === 1) {
      /* 단일 내역 케이스 (1개) */
      // 퇴근가능시간 계산
      availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(
        updateDto.checkInTime,
        approvedCommuteInfoList[0].leaveTypeIdx,
        isBirthday,
      );
      // 지각 판별
      const isPmQuarterLate =
        PM_QUARTER_REST_LISTS.has(approvedCommuteInfoList[0].leaveTypeIdx) &&
        new Date(updateDto.checkInTime) >= getNormalLateBoundary(new Date(updateDto.checkInTime));

      const isAmHalfLate =
        AM_REST_LISTS.has(approvedCommuteInfoList[0].leaveTypeIdx) &&
        new Date(updateDto.checkInTime) >= getAmHalfLateBoundary(new Date(updateDto.checkInTime));

      const isPMHalfLate =
        PM_REST_LISTS.has(approvedCommuteInfoList[0].leaveTypeIdx) &&
        new Date(updateDto.checkInTime) >= getPmHalfLateBoundary(new Date(updateDto.checkInTime));

      const isAmQuarterLate =
        AM_QUARTER_REST_LISTS.has(approvedCommuteInfoList[0].leaveTypeIdx) &&
        new Date(updateDto.checkInTime) >= getAmQuarterLateBoundary(new Date(updateDto.checkInTime));

      if (!updateDto.checkOutTime) {
        // 근무시간 계산
        workingMinutes = null;
        overtimeWorkingMinutes = null;
        // 근태 계산
        attendance =
          isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
            ? IntranetAttendanceEnum.CHECK_IN_LATE
            : IntranetAttendanceEnum.CHECK_IN;
      } else {
        // 근무시간 계산
        workingMinutes = (updateDto.checkOutTime.getTime() - updateDto.checkInTime.getTime()) / (1000 * 60);
        const standardWorkingMinutes = calculateSingleLeaveStandardWorkingMinutes(
          approvedCommuteInfoList[0].leaveTypeIdx,
          isBirthday,
        );
        overtimeWorkingMinutes =
          workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;
        // 근태 계산
        const checkInAttendance =
          isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
            ? IntranetAttendanceEnum.CHECK_IN_LATE
            : IntranetAttendanceEnum.CHECK_IN;
        if (checkInAttendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
              : IntranetAttendanceEnum.CHECK_OUT_LATE;
        } else {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT
              : IntranetAttendanceEnum.CHECK_OUT;
        }
      }
    } else {
      /* 미승인 케이스 (일반근무 포함) */
      // 퇴근가능시간 계산
      availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(
        updateDto.checkInTime,
        IntranetLeaveTypeIdxEnum.NORMAL,
        isBirthday,
      );
      // 지각 판별
      const isNormalLate = new Date(updateDto.checkInTime) >= getNormalLateBoundary(new Date(updateDto.checkInTime));

      if (!updateDto.checkOutTime) {
        // 근무시간 계산
        workingMinutes = null;
        overtimeWorkingMinutes = null;
        // 근태 계산
        attendance = isNormalLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
      } else {
        // 근무시간 계산
        workingMinutes = (updateDto.checkOutTime.getTime() - updateDto.checkInTime.getTime()) / (1000 * 60);
        const standardWorkingMinutes = calculateSingleLeaveStandardWorkingMinutes(
          IntranetLeaveTypeIdxEnum.NORMAL,
          isBirthday,
        );
        overtimeWorkingMinutes =
          workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;
        // 근태 계산
        const checkInAttendance = isNormalLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
        if (checkInAttendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
              : IntranetAttendanceEnum.CHECK_OUT_LATE;
        } else {
          attendance =
            updateDto.checkOutTime < availCheckOutTime
              ? IntranetAttendanceEnum.EARLY_CHECK_OUT
              : IntranetAttendanceEnum.CHECK_OUT;
        }
      }
    }

    await Promise.all(
      allValidCommutesByDate.map(async (commute) => {
        const updateInfo: UpdateCommuteTimeInfo = {
          ...updateDto,
          workingMinutes,
          overtimeWorkingMinutes,
          availCheckOutTime,
          attendance,
          adminUpdatedAt: new Date(),
          leaveTypeIdx: commute.leaveTypeIdx || IntranetLeaveTypeIdxEnum.NORMAL,
        };

        await this.commuteRepository.updateCommuteTime(commute.commuteIdx, updateInfo);
      }),
    );

    return;
  }

  @Transactional()
  async updateCommuteNoteByUser(commuteIdx: number, userName: string, noteInfo: UpdateNoteDto): Promise<void> {
    const commuteInfo = await this.commuteRepository.getCommuteInfoByIdx(commuteIdx);
    if (!commuteInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    const commutesByDate = await this.commuteRepository.getCommuteInfoByDate(
      commuteInfo.userIdx,
      commuteInfo.commuteDate,
    );

    const lastUpdatedAt: LastUpdated = { name: userName, time: new Date() };
    await Promise.all(
      commutesByDate.map(async (commute) => {
        // 비고 수정
        await this.commuteRepository.updateCommuteNoteByIdx(commute.commuteIdx, noteInfo);
        // 최근 수정일 변경
        await this.commuteRepository.updateLastUpdatedAt(commute.commuteIdx, lastUpdatedAt);
      }),
    );

    return;
  }

  @Transactional()
  async updateCommuteNoteByAdmin(commuteIdx: number, adminName: string, noteInfo: UpdateNoteDto): Promise<void> {
    const commuteInfo = await this.commuteRepository.getCommuteInfoByIdx(commuteIdx);
    if (!commuteInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    const commutesByDate = await this.commuteRepository.getCommuteInfoByDate(
      commuteInfo.userIdx,
      commuteInfo.commuteDate,
    );

    const lastUpdatedAt: LastUpdated = { name: adminName, time: new Date() };
    await Promise.all(
      commutesByDate.map(async (commute) => {
        // 비고 수정
        await this.commuteRepository.updateCommuteNoteByIdx(commute.commuteIdx, noteInfo);
        // 최근 수정일 변경
        await this.commuteRepository.updateLastUpdatedAt(commute.commuteIdx, lastUpdatedAt);
      }),
    );
    return;
  }

  async getUserWeelyWorkHours(userIdx: number, year: string, month: string) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const dailyWorkData = await this.commuteRepository.getUserWorkHoursByMonth(userIdx, startDate, endDate);

    const startWeekNumOfYear: number = moment(startDate).isoWeek(); // 올해 기준 몇 주차
    const lastWeekNumOfYear: number = moment(endDate).isoWeek(); // 올해 기준 몇 주차
    const weeklyWorkMap: Record<number, { start: string; end: string; hours: number }> = {};

    // 주차별 데이터를 저장할 객체 초기화
    for (let i = startWeekNumOfYear; i <= lastWeekNumOfYear; i++) {
      const weekStartDate: string = moment(startDate).isoWeek(i).startOf('isoWeek').format('YYYY-MM-DD');
      const weekEndDate: string = moment(weekStartDate).endOf('isoWeek').format('YYYY-MM-DD');

      weeklyWorkMap[i - startWeekNumOfYear + 1] = { start: weekStartDate, end: weekEndDate, hours: 0 };
    }

    // 출근 데이터를 주차별로 그룹화하여 합산
    dailyWorkData.forEach(({ commuteDate, workingMinutes }) => {
      const week = moment(commuteDate).isoWeek() - startWeekNumOfYear + 1;
      if (weeklyWorkMap[week]) {
        weeklyWorkMap[week].hours += Math.round((workingMinutes / 60) * 100) / 100;
      }
    });

    const weeklyWorkHours = Object.entries(weeklyWorkMap).map(([week, { start, end, hours }]) => ({
      week: Number(week),
      start,
      end,
      hours,
    }));

    const result = {
      year,
      month,
      weeklyWorkHours,
    };

    return result;
  }

  async getHolidayInfo(year: string, month: string) {
    const data = await this.holidayRepository.getHolidayInfo(year, month);

    return data;
  }
}
