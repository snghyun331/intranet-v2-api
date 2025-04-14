import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { CheckInDto } from './dto/checkIn.dto';
import { CheckOutDto } from './dto/checkOut.dto';
import {
  NORMAL_WORKING_MINUTES,
  FULL_DAY_REST_LISTS,
  HALF_HOLIDAY_WORKING_MINUTES,
  QUARTER_HOLIDAY_WORKING_MINUTES,
  PARTIAL_DAY_REST_LISTS,
  PM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  PM_REST_LISTS,
  AM_QUARTER_REST_LISTS,
} from '../../../common/constant/constant';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { ConfirmEnum, IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum } from '../../../common/constant/enum';
import {
  InsertCheckInInfo,
  UpdateCheckInInfo,
  UpdateCheckOutInfo,
  UpdateCommuteTimeInfo,
} from './interface/commute.interface';
import {
  getAmHalfEarlyBoundary,
  getAmHalfLateBoundary,
  getAmQuarterEarlyBoundary,
  getAmQuarterLateBoundary,
  getNormalEarlyBoundary,
  getNormalLateBoundary,
  getPmHalfLateBoundary,
  getStartAndEndDateByMonth,
} from '../../../common/utils/utility';
import { UpdateCommuteTimeDto } from './dto/updateCommuteTime.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class CommuteService {
  constructor(private readonly commuteRepository: CommuteRepository) {}

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
    /* 오늘의 출근 정보가 있는지 확인 */
    const commuteInfo = await this.commuteRepository.getCommuteInfoByDate(userIdx, commuteDate);
    /* commuteInfo가 존재: 일반적인 상황 */
    if (commuteInfo) {
      if (commuteInfo.checkInTime) {
        throw new BadRequestException('이미 출근이 등록되었습니다.');
      }
      /* 근태 상태가 휴무인지 확인 */
      if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }
      /* 근태가 반/반반차 일 경우 */
      if (PARTIAL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
        /* 지각 판별 */
        const isPmQuarterLate: boolean =
          PM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
          new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));

        const isAmHalfLate: boolean =
          AM_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
          new Date(checkInDto.checkInTime) >= getAmHalfLateBoundary(new Date(checkInDto.checkInTime));

        const isPMHalfLate: boolean =
          PM_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
          new Date(checkInDto.checkInTime) >= getPmHalfLateBoundary(new Date(checkInDto.checkInTime));

        const isAmQuarterLate: boolean =
          AM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
          new Date(checkInDto.checkInTime) >= getAmQuarterLateBoundary(new Date(checkInDto.checkInTime));

        const attendance: IntranetAttendanceEnum =
          isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
            ? IntranetAttendanceEnum.CHECK_IN_LATE
            : IntranetAttendanceEnum.CHECK_IN;

        const updateCheckInInfo: UpdateCheckInInfo = {
          ...checkInDto,
          attendance,
          commuteDate,
          checkInIpAddr,
          checkInLogAgent,
        };

        /* 근태 업데이트 */
        await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);

        return;
      }

      /* 일반 근무에 대한 지각 판별 */
      const isNormalLate: boolean =
        new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
      const attendance: IntranetAttendanceEnum = isNormalLate
        ? IntranetAttendanceEnum.CHECK_IN_LATE
        : IntranetAttendanceEnum.CHECK_IN;

      const updateCheckInInfo: UpdateCheckInInfo = {
        ...checkInDto,
        attendance,
        commuteDate,
        checkInIpAddr,
        checkInLogAgent,
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      };

      /* 일반 근무에 대한 근태 업데이트 */
      await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
    } else {
      /* commuteInfo가 없는 경우는 비정상적인 상황이며, 일반 근무로 간주됨 */
      const isNormalLate: boolean =
        new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
      const attendance: IntranetAttendanceEnum = isNormalLate
        ? IntranetAttendanceEnum.CHECK_IN_LATE
        : IntranetAttendanceEnum.CHECK_IN;

      const insertCheckInInfo: InsertCheckInInfo = {
        ...checkInDto,
        attendance,
        commuteDate,
        checkInIpAddr,
        checkInLogAgent,
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      };

      /* 근태 생성 */
      await this.commuteRepository.createCheckInWork(userIdx, insertCheckInInfo);
    }

    return;
  }

  @Transactional()
  async checkOutWork(
    userIdx: number,
    checkOutDto: CheckOutDto,
    checkOutIpAddr: string,
    checkOutLogAgent: string,
  ): Promise<void> {
    const commuteDate: string = moment(checkOutDto.checkOutTime).utcOffset(9).format('YYYY-MM-DD');

    /* 오늘의 출근 정보가 있는지 확인 */
    const commuteInfo = await this.commuteRepository.getCommuteInfoByDate(userIdx, commuteDate);
    if (!commuteInfo || !commuteInfo.checkInTime) {
      throw new BadRequestException('출근을 먼저 등록해주세요');
    }
    if (commuteInfo.checkOutTime) {
      throw new BadRequestException('이미 퇴근을 찍었습니다.');
    }
    /* 근태 상태가 휴무인지 확인 */
    if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }
    const { checkInTime, leaveTypeIdx } = commuteInfo;

    let standardWorkingMinutes: number;
    if (AM_REST_LISTS.has(leaveTypeIdx) || PM_REST_LISTS.has(leaveTypeIdx)) {
      standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
    } else if (AM_QUARTER_REST_LISTS.has(leaveTypeIdx) || PM_QUARTER_REST_LISTS.has(leaveTypeIdx)) {
      standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
    } else {
      standardWorkingMinutes = NORMAL_WORKING_MINUTES;
    }

    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);

    let finalCheckInTime: Date;
    if (AM_REST_LISTS.has(leaveTypeIdx) && checkInTime < getAmHalfEarlyBoundary(new Date(checkInTime))) {
      finalCheckInTime = getAmHalfEarlyBoundary(new Date(checkInTime));
    } else if (
      AM_QUARTER_REST_LISTS.has(leaveTypeIdx) &&
      checkInTime < getAmQuarterEarlyBoundary(new Date(checkInTime))
    ) {
      finalCheckInTime = getAmQuarterEarlyBoundary(new Date(checkInTime));
    } else if (
      (leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL ||
        leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_HALF ||
        leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_QUARTER) &&
      checkInTime < getNormalEarlyBoundary(new Date(checkInTime))
    ) {
      finalCheckInTime = getNormalEarlyBoundary(new Date(checkInTime));
    } else {
      finalCheckInTime = new Date(checkInTime);
    }

    const workingMinutes: number = (finalCheckOutTime.getTime() - finalCheckInTime.getTime()) / (1000 * 60);
    const overtimeWorkingMinutes: number =
      workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;

    /* 최종 근무시간이 기준시간 미만이면 사유를 필수 입력 */
    if (workingMinutes < standardWorkingMinutes && !checkOutDto.earlyLeaveReason) {
      throw new BadRequestException('조기퇴근 시, 사유 입력은 필수입니다.');
    }

    /* 근태 상태 설정 */
    let attendance: IntranetAttendanceEnum;
    if (commuteInfo.attendance === IntranetAttendanceEnum.CHECK_IN_LATE) {
      attendance =
        workingMinutes < standardWorkingMinutes
          ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
          : IntranetAttendanceEnum.CHECK_OUT_LATE;
    } else {
      attendance =
        workingMinutes < standardWorkingMinutes
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
    const { totalPage, total, records } = await this.commuteRepository.getCommuteRecords(pageNo, perPage, filterInfo);

    return { totalPage, total, records };
  }

  async getUserCommuteRecords(userIdx: number, { pageNo, perPage }: PageNoDto, filterInfo: UserCommuteFilterDto) {
    // 마감 날짜가 현재 날짜보다 미래라면, 현재 날짜까지 조회
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    if (filterInfo.eDate > nowDate) {
      filterInfo.eDate = nowDate;
    }

    const userCnt: number = await this.commuteRepository.getUserCountByIdx(userIdx);
    if (userCnt === 0) {
      throw new NotFoundException('해당 사용자는 존재하지 않습니다.');
    }

    const { totalPage, total, records } = await this.commuteRepository.getUserCommuteRecords(
      userIdx,
      pageNo,
      perPage,
      filterInfo,
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

      await this.commuteRepository.deleteCommute(commuteIdx);
    }
  }

  @Transactional()
  async updateCommuteTime(commuteIdx: number, updateDto: UpdateCommuteTimeDto): Promise<void> {
    const commuteInfo = await this.commuteRepository.getCommuteInfoByIdx(commuteIdx);
    if (!commuteInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    /* 지각 판별 */
    const isNormalLate: boolean =
      (commuteInfo.leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL ||
        PM_REST_LISTS.has(commuteInfo.leaveTypeIdx) ||
        PM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx)) &&
      new Date(updateDto.checkInTime) >= getNormalLateBoundary(new Date(updateDto.checkInTime));

    const isAmHalfLate: boolean =
      AM_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
      new Date(updateDto.checkInTime) >= getAmHalfLateBoundary(new Date(updateDto.checkInTime));

    const isAmQuarterLate: boolean =
      AM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
      new Date(updateDto.checkInTime) >= getAmQuarterLateBoundary(new Date(updateDto.checkInTime));

    const isLate: boolean = isNormalLate || isAmHalfLate || isAmQuarterLate;

    let standardWorkingMinutes: number;
    if (AM_REST_LISTS.has(commuteInfo.leaveTypeIdx) || PM_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
      standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
    } else if (
      AM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) ||
      PM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx)
    ) {
      standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
    } else {
      standardWorkingMinutes = NORMAL_WORKING_MINUTES;
    }

    /* 근무시간 계산 */
    let workingMinutes: number | null;
    let overtimeWorkingMinutes: number | null;
    let attendance: IntranetAttendanceEnum;
    if (!updateDto.checkOutTime) {
      workingMinutes = null;
      overtimeWorkingMinutes = null;
      attendance = isLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
    } else {
      workingMinutes = (updateDto.checkOutTime.getTime() - updateDto.checkInTime.getTime()) / (1000 * 60);
      overtimeWorkingMinutes =
        workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;

      if (isLate) {
        attendance =
          workingMinutes < standardWorkingMinutes
            ? IntranetAttendanceEnum.EARLY_CHECK_OUT_LATE
            : IntranetAttendanceEnum.CHECK_OUT_LATE;
      } else {
        attendance =
          workingMinutes < standardWorkingMinutes
            ? IntranetAttendanceEnum.EARLY_CHECK_OUT
            : IntranetAttendanceEnum.CHECK_OUT;
      }
    }

    const updateInfo: UpdateCommuteTimeInfo = {
      ...updateDto,
      workingMinutes,
      overtimeWorkingMinutes,
      attendance,
    };

    await this.commuteRepository.updateCommuteTime(commuteIdx, updateInfo);

    return;
  }

  @Transactional()
  async updateCommuteNote(commuteIdx: number, noteInfo: UpdateNoteDto): Promise<void> {
    const commuteCnt: number = await this.commuteRepository.getCommuteCountByIdx(commuteIdx);
    if (commuteCnt === 0) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    await this.commuteRepository.updateCommuteNote(commuteIdx, noteInfo);

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
}
