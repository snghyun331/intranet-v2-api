import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { CheckInDto } from './dto/checkIn.dto';
import { CheckOutDto } from './dto/checkOut.dto';
import {
  NORMAL_WORKING_MINUTES,
  FULL_DAY_REST_LISTS,
  FOUR_HOURS_WORKING_MINUTES,
  SEVEN_HOURS_WORKING_MINUTES,
  PARTIAL_DAY_REST_LISTS,
  PM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  PM_REST_LISTS,
  AM_QUARTER_REST_LISTS,
} from '@common/constant/constant';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { ConfirmEnum, IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum, RequestTypeEnum } from '@common/constant/enum';
import {
  calculateAvailCheckOutTime,
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

@Injectable()
export class CommuteService {
  constructor(
    private readonly commuteRepository: CommuteRepository,
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
    /* commuteInfoList가 존재: 일반적인 상황 */
    if (commuteInfoList && commuteInfoList.length > 0) {
      // 이미 출근이 등록된 내역이 있는지 확인
      const hasCheckedIn: boolean = commuteInfoList.some((info: any) => info.checkInTime);
      if (hasCheckedIn) {
        throw new BadRequestException('이미 출근이 등록되었습니다.');
      }
      if (commuteInfoList.length === 2) {
        /* 조합휴가 케이스 (2개 휴가) */
        await this.handleCombinedLeaveCheckIn(
          commuteInfoList,
          checkInDto,
          checkInLogAgent,
          checkInIpAddr,
          userIdx,
          commuteDate,
          isBirthday,
          checkInHour,
        );
      } else {
        /* 단일 내역 케이스 (1개) */
        await this.handleSingleCommuteCheckIn(
          commuteInfoList[0],
          checkInDto,
          checkInLogAgent,
          checkInIpAddr,
          userIdx,
          commuteDate,
          isBirthday,
          checkInHour,
        );
      }
    } else {
      /* commuteInfo가 없는 경우는 비정상적인 상황이며, 일반 근무로 간주됨 */
      await this.handleNoCommuteInfoCheckIn(
        checkInDto,
        checkInLogAgent,
        checkInIpAddr,
        userIdx,
        commuteDate,
        isBirthday,
        checkInHour,
      );
    }
    return;
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
    // 승인된 휴가만 필터링
    const approvedLeaves = commuteInfoList.filter((info) => info.confirmYN === ConfirmEnum.YES);

    // 둘 다 승인된 휴가인 경우, 반차 + 반차 => 출근 불가, 반반차 + 반반차 => 출근 가능
    if (approvedLeaves.length === 2) {
      const leaveTypes = approvedLeaves.map((leave) => leave.leaveTypeIdx);

      // 반차 조합 확인 (오전반차 + 오후반차)
      const hasAmHalf = leaveTypes.some((type) => AM_REST_LISTS.has(type));
      const hasPmHalf = leaveTypes.some((type) => PM_REST_LISTS.has(type));

      // 반반차 조합 확인 (오전반반차 + 오후반반차)
      const hasAmQuarter = leaveTypes.some((type) => AM_QUARTER_REST_LISTS.has(type));
      const hasPmQuarter = leaveTypes.some((type) => PM_QUARTER_REST_LISTS.has(type));

      // 반차 + 반차 조합인 경우 출근 불가
      if (hasAmHalf && hasPmHalf) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }

      // 반반차 + 반반차 조합인 경우 출근 가능
      if (hasAmQuarter && hasPmQuarter) {
        // 오전반반차 기준으로 지각 판별 및 출근 처리
        const { attendance, availCheckOutTime, targetCommuteIdx } = await this.calculateCombinedLeaveAttendance(
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

        await this.commuteRepository.updateCheckInWorkByCommuteDate(commuteDate, userIdx, updateCheckInInfo);

        return;
      }

      // 그 외 조합 (반차 + 반반차, 다른 휴가 조합 등)은 출근 불가
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    } else if (approvedLeaves.length === 1) {
      const approvedLeave = approvedLeaves[0];
      // 종일 휴가인 경우 출근 불가
      if (FULL_DAY_REST_LISTS.has(approvedLeave.leaveTypeIdx)) {
        throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
      }
      // 반차/반반차인 경우 지각 판별 및 출근 처리
      if (PARTIAL_DAY_REST_LISTS.has(approvedLeave.leaveTypeIdx)) {
        const { attendance, availCheckOutTime, targetCommuteIdx } = await this.calculateCombinedLeaveAttendance(
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

        /* 조합휴가의 경우 모든 내역에 같은 출근 정보 업데이트 */
        await this.commuteRepository.updateCheckInWorkByCommuteDate(commuteDate, userIdx, updateCheckInInfo);

        return;
      }
    } else {
      // 승인된 휴가가 없는 경우 일반 근무로 처리
      const { attendance, availCheckOutTime } = await this.calculateNormalAttendance(
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
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
        availCheckOutTime,
      };

      /* 첫 번째 내역을 일반 근무로 업데이트 */
      await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
    }
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
    if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
      throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
    }

    /* 근태가 반/반반차 일 경우 */
    if (PARTIAL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
      const { attendance, availCheckOutTime } = await this.calculatePartialLeaveAttendance(
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
    } else {
      /* 일반 근무에 대한 처리 */
      const { attendance, availCheckOutTime } = await this.calculateNormalAttendance(
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
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
        availCheckOutTime,
      };

      /* 일반 근무에 대한 근태 업데이트 */
      await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
    }
  }

  private async handleNoCommuteInfoCheckIn(
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

    const insertCheckInInfo: InsertCheckInInfo = {
      ...checkInDto,
      attendance,
      commuteDate,
      checkInIpAddr,
      checkInLogAgent,
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      availCheckOutTime,
    };

    /* 근태 생성 */
    await this.commuteRepository.createCheckInWork(userIdx, insertCheckInInfo);
  }

  /**
   * 조합휴가 지각 판별 (오전반반차 기준)
   */
  private async calculateCombinedLeaveAttendance(
    commuteInfoList: any[],
    checkInTime: Date,
    isBirthday: boolean,
    checkInHour: number,
  ) {
    // 오전반반차가 있는지 확인
    const amQuarterLeave = commuteInfoList.find(
      (info) => AM_QUARTER_REST_LISTS.has(info.leaveTypeIdx) && info.confirmYN === ConfirmEnum.YES,
    );

    let attendance: IntranetAttendanceEnum;
    let leaveTypeForCalculation: number;
    let targetCommuteIdx: number;

    if (amQuarterLeave) {
      // 오전반반차가 있으면 오전반반차 기준으로 지각 판별
      const isAmQuarterLate = new Date(checkInTime) >= getAmQuarterLateBoundary(new Date(checkInTime));
      attendance = isAmQuarterLate
        ? IntranetAttendanceEnum.CHECK_IN_LATE
        : checkInHour >= 6 && checkInHour < 8
          ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
          : IntranetAttendanceEnum.CHECK_IN;

      leaveTypeForCalculation = amQuarterLeave.leaveTypeIdx;
      targetCommuteIdx = amQuarterLeave.commuteIdx;
    } else {
      // 오전반반차가 없으면 첫 번째 휴가 기준으로 처리
      const firstLeave = commuteInfoList[0];
      const { attendance: calculatedAttendance } = await this.calculatePartialLeaveAttendance(
        firstLeave.leaveTypeIdx,
        checkInTime,
        isBirthday,
        checkInHour,
      );

      attendance = calculatedAttendance;
      leaveTypeForCalculation = firstLeave.leaveTypeIdx;
      targetCommuteIdx = firstLeave.commuteIdx;
    }

    const availCheckOutTime = calculateAvailCheckOutTime(
      checkInTime,
      leaveTypeForCalculation,
      ConfirmEnum.YES,
      isBirthday,
    );

    return { attendance, availCheckOutTime, targetCommuteIdx };
  }

  /**
   * 반차/반반차 지각 판별
   */
  private async calculatePartialLeaveAttendance(
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

    const availCheckOutTime = calculateAvailCheckOutTime(checkInTime, leaveTypeIdx, ConfirmEnum.YES, isBirthday);

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

    const availCheckOutTime = calculateAvailCheckOutTime(
      checkInTime,
      IntranetLeaveTypeIdxEnum.NORMAL,
      ConfirmEnum.NO,
      isBirthday,
    );

    return { attendance, availCheckOutTime };
  }

  //     /* 근태 상태가 휴무인지 확인 */
  //     if (FULL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
  //       throw new BadRequestException('오늘은 연차/휴무 날 입니다.');
  //     }

  //     /* 근태가 반/반반차 일 경우 */
  //     if (PARTIAL_DAY_REST_LISTS.has(commuteInfo.leaveTypeIdx) && commuteInfo.confirmYN === ConfirmEnum.YES) {
  //       /* 지각 판별 */
  //       const isPmQuarterLate: boolean =
  //         PM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
  //         new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));

  //       const isAmHalfLate: boolean =
  //         AM_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
  //         new Date(checkInDto.checkInTime) >= getAmHalfLateBoundary(new Date(checkInDto.checkInTime));

  //       const isPMHalfLate: boolean =
  //         PM_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
  //         new Date(checkInDto.checkInTime) >= getPmHalfLateBoundary(new Date(checkInDto.checkInTime));

  //       const isAmQuarterLate: boolean =
  //         AM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) &&
  //         new Date(checkInDto.checkInTime) >= getAmQuarterLateBoundary(new Date(checkInDto.checkInTime));

  //       const attendance: IntranetAttendanceEnum =
  //         isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
  //           ? IntranetAttendanceEnum.CHECK_IN_LATE
  //           : checkInHour >= 6 && checkInHour < 8
  //             ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
  //             : IntranetAttendanceEnum.CHECK_IN;

  //       const availCheckOutTime: Date = calculateAvailCheckOutTime(
  //         checkInDto.checkInTime,
  //         commuteInfo.leaveTypeIdx,
  //         commuteInfo.confirmYN,
  //         isBirthday,
  //       );

  //       const updateCheckInInfo: UpdateCheckInInfo = {
  //         ...checkInDto,
  //         attendance,
  //         commuteDate,
  //         checkInIpAddr,
  //         checkInLogAgent,
  //         availCheckOutTime,
  //       };

  //       /* 근태 업데이트 */
  //       await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);

  //       return;
  //     } else {
  //       /* 일반 근무에 대한 지각 판별 */
  //       const isNormalLate: boolean =
  //         new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
  //       const attendance: IntranetAttendanceEnum = isNormalLate
  //         ? IntranetAttendanceEnum.CHECK_IN_LATE
  //         : checkInHour >= 6 && checkInHour < 8
  //           ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
  //           : IntranetAttendanceEnum.CHECK_IN;

  //       const availCheckOutTime: Date = calculateAvailCheckOutTime(
  //         checkInDto.checkInTime,
  //         IntranetLeaveTypeIdxEnum.NORMAL,
  //         ConfirmEnum.NO,
  //         isBirthday,
  //       );

  //       const updateCheckInInfo: UpdateCheckInInfo = {
  //         ...checkInDto,
  //         attendance,
  //         commuteDate,
  //         checkInIpAddr,
  //         checkInLogAgent,
  //         leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
  //         availCheckOutTime,
  //       };

  //       /* 일반 근무에 대한 근태 업데이트 */
  //       await this.commuteRepository.updateCheckInWork(userIdx, updateCheckInInfo);
  //     }
  //   } else {
  //     /* commuteInfo가 없는 경우는 비정상적인 상황이며, 일반 근무로 간주됨 */
  //     const isNormalLate: boolean =
  //       new Date(checkInDto.checkInTime) >= getNormalLateBoundary(new Date(checkInDto.checkInTime));
  //     const attendance: IntranetAttendanceEnum = isNormalLate
  //       ? IntranetAttendanceEnum.CHECK_IN_LATE
  //       : checkInHour >= 6 && checkInHour < 8
  //         ? IntranetAttendanceEnum.CHECK_IN_ON_SITE
  //         : IntranetAttendanceEnum.CHECK_IN;

  //     const availCheckOutTime: Date = calculateAvailCheckOutTime(
  //       checkInDto.checkInTime,
  //       IntranetLeaveTypeIdxEnum.NORMAL,
  //       ConfirmEnum.NO,
  //       isBirthday,
  //     );

  //     const insertCheckInInfo: InsertCheckInInfo = {
  //       ...checkInDto,
  //       attendance,
  //       commuteDate,
  //       checkInIpAddr,
  //       checkInLogAgent,
  //       leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
  //       availCheckOutTime,
  //     };

  //     /* 근태 생성 */
  //     await this.commuteRepository.createCheckInWork(userIdx, insertCheckInInfo);
  //   }

  //   return;
  // }

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
      (leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL ||
        leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_HALF ||
        leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_QUARTER) &&
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

    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
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

    /* 필요하다면, 근무유형(leaveTypeIdx) 수정 */
    let leaveTypeIdx: IntranetLeaveTypeIdxEnum;
    if (!commuteInfo.leaveTypeIdx && updateDto.checkInTime) {
      leaveTypeIdx = IntranetLeaveTypeIdxEnum.NORMAL;
    }
    if (commuteInfo.leaveTypeIdx === IntranetLeaveTypeIdxEnum.NORMAL && !updateDto.checkInTime) {
      leaveTypeIdx = null;
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
      standardWorkingMinutes = FOUR_HOURS_WORKING_MINUTES;
    } else if (
      AM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx) ||
      PM_QUARTER_REST_LISTS.has(commuteInfo.leaveTypeIdx)
    ) {
      standardWorkingMinutes = SEVEN_HOURS_WORKING_MINUTES;
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
      leaveTypeIdx: leaveTypeIdx || commuteInfo.leaveTypeIdx,
    };

    await this.commuteRepository.updateCommuteTime(commuteIdx, updateInfo);

    return;
  }

  @Transactional()
  async updateCommuteNote(commuteIdx: number, noteInfo: UpdateNoteDto, type: RequestTypeEnum): Promise<void> {
    const commuteCnt: number = await this.commuteRepository.getCommuteCountByIdx(commuteIdx);
    if (commuteCnt === 0) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    await this.commuteRepository.updateCommuteNote(commuteIdx, noteInfo, type);

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
