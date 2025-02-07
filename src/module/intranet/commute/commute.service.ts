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
import {
  DeviceTypeEnum,
  IntranetAttendanceEnum,
  IntranetLeaveTypeEnum,
  LateStatusEnum,
} from '../../../common/constant/enum';
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
} from '../../../common/utils/utility';
import { UpdateCommuteTimeDto } from './dto/updateCommuteTime.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';

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
    const commuteInfo = await this.commuteRepository.getCommuteInfoByDate(userIdx, commuteDate);
    if (commuteInfo) {
      if (commuteInfo.checkInTime) {
        throw new BadRequestException('이미 출근이 등록되었습니다.');
      }
      /* 근태 상태가 휴무인지 확인 */
      if (FULL_DAY_REST_LISTS.includes(commuteInfo.leaveType)) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }
      /* 근태가 반/반반차이면 업데이트 */
      if (PARTIAL_DAY_REST_LISTS.includes(commuteInfo.leaveType)) {
        /* 지각 판별 */
        const isPmQuarterLate: boolean =
          commuteInfo.leaveType === IntranetLeaveTypeEnum.PM_QUARTER &&
          new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));

        const isAmHalfLate: boolean =
          commuteInfo.leaveType === IntranetLeaveTypeEnum.AM_HALF &&
          new Date(checkInDto.checkInTime) >= getAmHalfLateBoundary(new Date(checkInDto.checkInTime));

        const isPMHalfLate: boolean =
          commuteInfo.leaveType === IntranetLeaveTypeEnum.PM_HALF &&
          new Date(checkInDto.checkInTime) >= getPmHalfLateBoundary(new Date(checkInDto.checkInTime));

        const isAmQuarterLate: boolean =
          commuteInfo.leaveType === IntranetLeaveTypeEnum.AM_QUARTER &&
          new Date(checkInDto.checkInTime) >= getAmQuarterLateBoundary(new Date(checkInDto.checkInTime));

        const lateStatus: LateStatusEnum =
          isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
            ? LateStatusEnum.LATE
            : LateStatusEnum.ON_TIME;

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
      const isNormalLate: boolean =
        new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
      const lateStatus: LateStatusEnum = isNormalLate ? LateStatusEnum.LATE : LateStatusEnum.ON_TIME;

      const insertCheckInInfo: InsertCheckInInfo = {
        ...checkInDto,
        lateStatus,
        commuteDate,
        checkInIpAddr,
        leaveType: IntranetLeaveTypeEnum.NORMAL,
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
    const commuteInfo = await this.commuteRepository.getCommuteInfoByDate(userIdx, commuteDate);
    if (!commuteInfo) {
      throw new BadRequestException('출근을 먼저 등록해주세요');
    }
    if (commuteInfo.checkOutTime) {
      throw new BadRequestException('이미 퇴근을 찍었습니다.');
    }
    /* 근태 상태가 휴무인지 확인 */
    if (FULL_DAY_REST_LISTS.includes(commuteInfo.leaveType)) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }
    const { checkInTime, leaveType } = commuteInfo;

    let standardWorkingMinutes: number;
    switch (leaveType) {
      case IntranetLeaveTypeEnum.NORMAL:
        standardWorkingMinutes = NORMAL_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.AM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.PM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.AM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.PM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
    }

    /* 최종 근무시간 혹은 초과근무시간 저장 */
    const finalCheckOutTime: Date = new Date(checkOutDto.checkOutTime);
    // 추후 리펙토링 필요....
    let finalCheckInTime: Date;
    if (leaveType === IntranetLeaveTypeEnum.AM_HALF && checkInTime < getAmHalfEarlyBoundary(new Date(checkInTime))) {
      finalCheckInTime = getAmHalfEarlyBoundary(new Date(checkInTime));
    } else if (
      leaveType === IntranetLeaveTypeEnum.AM_QUARTER &&
      checkInTime < getAmQuarterEarlyBoundary(new Date(checkInTime))
    ) {
      finalCheckInTime = getAmQuarterEarlyBoundary(new Date(checkInTime));
    } else if (
      leaveType === IntranetLeaveTypeEnum.NORMAL &&
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
    const attendance: IntranetAttendanceEnum =
      workingMinutes < standardWorkingMinutes
        ? IntranetAttendanceEnum.EARLY_CHECK_OUT
        : IntranetAttendanceEnum.CHECK_OUT;

    const updateCheckOutInfo: UpdateCheckOutInfo = {
      commuteDate,
      ...checkOutDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkOutIpAddr,
      attendance,
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

  async updateCommuteTime(commuteIdx: number, updateDto: UpdateCommuteTimeDto, manager: EntityManager): Promise<void> {
    const commuteInfo = await this.commuteRepository.getCommuteInfoByIdx(commuteIdx);
    if (!commuteInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    /* 지각 판별 */
    const isLate: boolean =
      (commuteInfo.leaveType === IntranetLeaveTypeEnum.NORMAL ||
        commuteInfo.leaveType === IntranetLeaveTypeEnum.PM_HALF ||
        commuteInfo.leaveType === IntranetLeaveTypeEnum.PM_QUARTER) &&
      new Date(updateDto.checkInTime) >= getNormalLateBoundary(new Date(updateDto.checkInTime));

    const isAmHalfLate: boolean =
      commuteInfo.leaveType === IntranetLeaveTypeEnum.AM_HALF &&
      new Date(updateDto.checkInTime) >= getAmHalfLateBoundary(new Date(updateDto.checkInTime));

    const isAmQuarterLate: boolean =
      commuteInfo.leaveType === IntranetLeaveTypeEnum.AM_QUARTER &&
      new Date(updateDto.checkInTime) >= getAmQuarterLateBoundary(new Date(updateDto.checkInTime));

    const lateStatus: LateStatusEnum =
      isLate || isAmHalfLate || isAmQuarterLate ? LateStatusEnum.LATE : LateStatusEnum.ON_TIME;

    let standardWorkingMinutes: number;
    switch (commuteInfo.leaveType) {
      case IntranetLeaveTypeEnum.NORMAL:
        standardWorkingMinutes = NORMAL_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.AM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.PM_HALF:
        standardWorkingMinutes = HALF_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.AM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
      case IntranetLeaveTypeEnum.PM_QUARTER:
        standardWorkingMinutes = QUARTER_HOLIDAY_WORKING_MINUTES;
        break;
    }

    /* 근무시간 계산 */
    let workingMinutes: number | null;
    let overtimeWorkingMinutes: number | null;
    if (!updateDto.checkOutTime) {
      workingMinutes = null;
      overtimeWorkingMinutes = null;
    } else {
      workingMinutes = (updateDto.checkOutTime.getTime() - updateDto.checkInTime.getTime()) / (1000 * 60);
      overtimeWorkingMinutes =
        workingMinutes > standardWorkingMinutes ? Math.floor(workingMinutes - standardWorkingMinutes) : 0;
    }

    /* 출퇴근 IP 및 디바이스 업데이트 */
    const { checkInIpAddr, checkInDeviceType } =
      commuteInfo.checkInTime !== updateDto.checkInTime
        ? { checkInIpAddr: null, checkInDeviceType: DeviceTypeEnum.MAUNAL }
        : { checkInIpAddr: commuteInfo.checkInIpAddr, checkInDeviceType: commuteInfo.checkInDeviceType };

    const { checkOutIpAddr, checkOutDeviceType } = !updateDto.checkOutTime
      ? { checkOutIpAddr: null, checkOutDeviceType: null }
      : commuteInfo.checkOutTime !== updateDto.checkOutTime
        ? { checkOutIpAddr: null, checkOutDeviceType: DeviceTypeEnum.MAUNAL }
        : { checkOutIpAddr: commuteInfo.checkOutIpAddr, checkOutDeviceType: commuteInfo.checkOutDeviceType };

    const updateInfo: UpdateCommuteTimeInfo = {
      ...updateDto,
      workingMinutes,
      overtimeWorkingMinutes,
      checkInIpAddr,
      checkOutIpAddr,
      checkInDeviceType,
      checkOutDeviceType,
      lateStatus,
    };

    await this.commuteRepository.updateCommuteTime(commuteIdx, updateInfo, manager);

    return;
  }

  async updateCommuteNote(commuteIdx: number, noteInfo: UpdateNoteDto, manager: EntityManager): Promise<void> {
    const commuteCnt: number = await this.commuteRepository.getCommuteCountByIdx(commuteIdx);
    if (commuteCnt === 0) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    await this.commuteRepository.updateCommuteNote(commuteIdx, noteInfo, manager);

    return;
  }
}
