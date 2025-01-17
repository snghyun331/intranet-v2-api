import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { CheckInDto } from './dto/checkIn.dto';
import { EntityManager } from 'typeorm';
import { CheckOutDto } from './dto/checkOut.dto';
import {
  NORMAL_WORKING_MINUTES,
  FULL_DAY_REST_LISTS,
  HALF_HOLIDAY_WORKING_MINUTES,
  QUARTER_HOLIDAY_WORKING_MINUTES,
  PARTIAL_DAY_REST_LISTS,
} from '../../../common/constant/constant';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminCommuteFilterDto } from './dto/query.dto';
import { IntranetAttendanceEnum, LateStatusEnum } from '../../../common/constant/enum';
import { InsertCheckInInfo, UpdateCheckInInfo, UpdateCheckOutInfo } from './interface/commute.interface';
import {
  getAmHalfEarlyBoundary,
  getAmHalfLateBoundary,
  getAmQuarterEarlyBoundary,
  getAmQuarterLateBoundary,
  getNormalEarlyBoundary,
  getNormalLateBoundary,
} from '../../../common/utils/utility';

@Injectable()
export class CommuteService {
  constructor(private readonly commuteRepository: CommuteRepository) {}

  async checkInWork(
    userIdx: number,
    checkInDto: CheckInDto,
    checkInIpAddr: string,
    manager: EntityManager,
  ): Promise<void> {
    const commuteDate: string = moment(checkInDto.checkInTime).utcOffset(9).format('YYYY-MM-DD');
    /* 오늘의 출근 정보가 있는지 확인 */
    const todayCommuteInfo = await this.commuteRepository.getTodayCommuteInfo(userIdx, commuteDate);
    if (todayCommuteInfo) {
      if (todayCommuteInfo.checkInTime) {
        throw new BadRequestException('이미 출근이 등록되었습니다.');
      }
      /* 근태 상태가 휴무인지 확인 */
      if (FULL_DAY_REST_LISTS.includes(todayCommuteInfo.attendance)) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }
      /* 근태가 반/반반차이면 업데이트 */
      if (PARTIAL_DAY_REST_LISTS.includes(todayCommuteInfo.attendance)) {
        /* 지각 판별 */
        const isLate: boolean =
          (todayCommuteInfo.attendance === IntranetAttendanceEnum.PM_HALF ||
            todayCommuteInfo.attendance === IntranetAttendanceEnum.PM_QUARTER) &&
          new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));

        const isAmHalfLate: boolean =
          todayCommuteInfo.attendance === IntranetAttendanceEnum.AM_HALF &&
          new Date(checkInDto.checkInTime) >= getAmHalfLateBoundary(new Date(checkInDto.checkInTime));

        const isAmQuarterLate: boolean =
          todayCommuteInfo.attendance === IntranetAttendanceEnum.AM_QUARTER &&
          new Date(checkInDto.checkInTime) >= getAmQuarterLateBoundary(new Date(checkInDto.checkInTime));

        const lateStatus: LateStatusEnum =
          isLate || isAmHalfLate || isAmQuarterLate ? LateStatusEnum.LATE : LateStatusEnum.ON_TIME;

        const updateCheckInInfo: UpdateCheckInInfo = {
          ...checkInDto,
          lateStatus,
          commuteDate,
          checkInIpAddr,
        };

        /* 근태 업데이트 */
        await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo, manager);
      }
    } else {
      /* 지각 판별 */
      const isLate: boolean =
        new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
      const lateStatus: LateStatusEnum = isLate ? LateStatusEnum.LATE : LateStatusEnum.ON_TIME;

      const insertCheckInInfo: InsertCheckInInfo = {
        ...checkInDto,
        lateStatus,
        commuteDate,
        checkInIpAddr,
        attendance: IntranetAttendanceEnum.NORMAL,
      };

      /* 근태 생성 */
      await this.commuteRepository.createCheckInWork(userIdx, insertCheckInInfo, manager);
    }

    return;
  }

  async checkOutWork(
    userIdx: number,
    checkOutDto: CheckOutDto,
    checkOutIpAddr: string,
    manager: EntityManager,
  ): Promise<void> {
    const commuteDate: string = moment(checkOutDto.checkOutTime).utcOffset(9).format('YYYY-MM-DD');
    /* 오늘의 출근 정보가 있는지 확인 */
    const todayCommuteInfo = await this.commuteRepository.getTodayCommuteInfo(userIdx, commuteDate);
    if (!todayCommuteInfo) {
      throw new BadRequestException('출근을 먼저 등록해주세요');
    }
    if (todayCommuteInfo.checkOutTime) {
      throw new BadRequestException('이미 퇴근을 찍었습니다.');
    }
    /* 근태 상태가 휴무인지 확인 */
    if (FULL_DAY_REST_LISTS.includes(todayCommuteInfo.attendance)) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }
    const { checkInTime, attendance } = todayCommuteInfo;

    let standardWorkingMinutes: number;
    switch (attendance) {
      case IntranetAttendanceEnum.NORMAL:
        standardWorkingMinutes = NORMAL_WORKING_MINUTES;
        break;
      case IntranetAttendanceEnum.AM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetAttendanceEnum.PM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetAttendanceEnum.AM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetAttendanceEnum.PM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
    }

    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);
    const finalCheckInTime: Date =
      attendance === IntranetAttendanceEnum.AM_HALF && checkInTime < getAmHalfEarlyBoundary(new Date(checkInTime))
        ? getAmHalfEarlyBoundary(new Date(checkInTime))
        : attendance === IntranetAttendanceEnum.AM_QUARTER &&
            checkInTime < getAmQuarterEarlyBoundary(new Date(checkInTime))
          ? getAmQuarterEarlyBoundary(new Date(checkInTime))
          : attendance === IntranetAttendanceEnum.NORMAL && checkInTime < getNormalEarlyBoundary(new Date(checkInTime))
            ? getNormalEarlyBoundary(new Date(checkInTime))
            : new Date(checkInTime);

    const workingMinutes: number = (finalCheckOutTime.getTime() - finalCheckInTime.getTime()) / (1000 * 60);
    const overtimeWorkingMinutes: number =
      workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;

    /* 최종 근무시간이 기준시간 미만이면 사유를 필수 입력 */
    const isEarlyLeave: boolean = workingMinutes < standardWorkingMinutes && !checkOutDto.earlyLeaveReason;
    if (isEarlyLeave) {
      throw new BadRequestException('조기퇴근 시, 사유 입력은 필수입니다.');
    }

    const updateCheckOutInfo: UpdateCheckOutInfo = {
      commuteDate,
      ...checkOutDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkOutIpAddr,
    };

    await this.commuteRepository.checkOutWork(userIdx, updateCheckOutInfo, manager);

    return;
  }

  async getUserCommuteRecords({ pageNo, perPage }: PageNoDto, filterInfo: AdminCommuteFilterDto) {
    const { totalPage, total, records } = await this.commuteRepository.getCommuteRecords(pageNo, perPage, filterInfo);

    return { totalPage, total, records };
  }

  async deleteUserCommuteRecord(commuteIdxList: number[], manager: EntityManager): Promise<void> {
    await Promise.all(
      commuteIdxList.map(async (commuteIdx) => {
        const commuteCnt: number = await this.commuteRepository.getCommuteCountByIdx(commuteIdx);
        if (commuteCnt === 0) {
          throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
        }

        await this.commuteRepository.deleteCommute(commuteIdx, manager);
      }),
    );
  }
}
