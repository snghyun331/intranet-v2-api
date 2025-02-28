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
  PM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  PM_REST_LISTS,
  AM_QUARTER_REST_LISTS,
} from '../../../common/constant/constant';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { DeviceTypeEnum, IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum } from '../../../common/constant/enum';
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
      if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }
      /* 근태가 반/반반차이면 업데이트 */
      if (PARTIAL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
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
        };

        /* 근태 업데이트 */
        await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo, manager);
      }
    } else {
      /* 지각 판별 */
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
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
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
    if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx)) {
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
      leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL &&
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
      attendance,
    };

    await this.commuteRepository.checkOutWork(userIdx, updateCheckOutInfo, manager);

    return;
  }

  async getCommuteRecords({ pageNo, perPage }: PageNoDto, filterInfo: AdminCommuteFilterDto) {
    const { totalPage, total, records } = await this.commuteRepository.getCommuteRecords(pageNo, perPage, filterInfo);

    return { totalPage, total, records };
  }

  async getUserCommuteRecords(userIdx: number, { pageNo, perPage }: PageNoDto, filterInfo: UserCommuteFilterDto) {
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
      attendance,
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
