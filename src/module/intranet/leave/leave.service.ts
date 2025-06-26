import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { ConfirmEnum, IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum, NodeEnvEnum } from '@common/constant/enum';
import { AwsService } from '@aws/aws.service';
import { LeaveDetail, LeaveImageInfo, LeaveSummary, LeaveUsageStats } from './interface/leave.interface';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto, UserLeaveDetailFilterDto } from './dto/query.dto';
import {
  addConfirmStatusField,
  calculateCombinedCommuteAvailCheckOutTime,
  calculateCombinedLeaveStandardWorkingMinutes,
  calculateSingleCommuteAvailCheckOutTime,
  getAmHalfLateBoundary,
  getAmQuarterLateBoundary,
  getNormalLateBoundary,
  getOneYearAfterJoin,
  getPmHalfLateBoundary,
  getYearsSinceJoin,
  removeDuplicateIdxs,
  substringYearMonth,
} from '@common/utils/utility';
import {
  ALTERNATIVE_LEAVE_LISTS,
  AM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  ANNUAL_LEAVE_LISTS,
  HALF_ANNUAL_LEAVE_LISTS,
  PM_QUARTER_REST_LISTS,
  PM_REST_LISTS,
  QUARTER_ANNUAL_LEAVE_LISTS,
  SPECIAL_LEAVE_LISTS,
  TRAINING_LEAVE_LISTS,
  TWO_HOURS_HALF_WORKIMG_MINUTES,
} from '@common/constant/constant';
import { UserPayload } from '@common/interface/payload.interface';
import { UpdateAnnualLeaveDto } from './dto/updateAnnualLeave.dto';
import { ApprovalRepository } from '../approval/repository/approval.repository';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { Transactional } from 'typeorm-transactional';
import { CreateExtraLeaveDto } from './dto/createExtraLeave.dto';
import { NewLeaveExtra } from './interface/leaveExtra.interface';
import { UpdateExtraLeaveDto } from './dto/updateExtraLeave.dto';
import { GlobalUserRepository } from '@global/repository/globalUser.repository';
import { GlobalMealRepository } from '@global/repository/globalMeal.repository';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly approvalRepository: ApprovalRepository,
    private readonly mealRepository: GlobalMealRepository,
    private readonly userRepository: GlobalUserRepository,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  @Transactional()
  async createLeave(dto: LeaveRequestDto, user: UserPayload, leaveImage?: Express.Multer.File): Promise<void> {
    const userIdx: number = user.userIdx;
    const { leaveInfo, approverIdxs, ccUserIdxs, note } = dto;
    const { year, month } = substringYearMonth(leaveInfo[0].commuteDate);

    // 특별휴무, 대체휴무, 연차 총/잔여 개수 조회
    let { totalAnnualLeaveBalance, totalSpecialLeaveBalance, totalAlternativeLeaveBalance } =
      await this.leaveRepository.getAllLeaveSummary(userIdx, year);

    // 휴무별 미승인 차감단위 합 조회
    const { unComfirmedAlternativeReduce, unComfirmedAnnualReduce, unComfirmedSpecialReduce } =
      await this.leaveRepository.getTotalUnConfirmedReduceUnit(userIdx, year);

    for (const leave of leaveInfo as LeaveDetail[]) {
      const commuteDate: string = leave.commuteDate;
      const leaveTypeIdx: number = Number(leave.leaveTypeIdx);
      const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateStringFormat.test(commuteDate)) {
        throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
      }
      if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leaveTypeIdx)) {
        throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
      }

      const leaveReduceUnit: number = await this.calculateLeaveReduceUnit(leaveTypeIdx); // 연차 차감단위

      /* 같은 날에 이미 등록한 1개 휴가가 있는 경우 처리 방법 */
      const existingValidateLeaves = await this.leaveRepository.getValidateLeaveInfoByDate(userIdx, commuteDate);
      if (existingValidateLeaves.length >= 2) {
        throw new BadRequestException('하루에 최대 2개의 휴가만 사용할 수 있습니다.');
      }
      if (existingValidateLeaves.length === 1) {
        // 하루에 사용한 휴가 총합이 1.0을 초과하면 사용불가
        if (existingValidateLeaves[0].leaveReduceUnit + leaveReduceUnit > 1.0) {
          throw new BadRequestException('휴가는 하루에 최대 1.0까지만 사용할 수 있습니다.');
        }

        // 총 근무시간이 3시간 미만인 경우 사용불가
        const standardWorkingMinutes = calculateCombinedLeaveStandardWorkingMinutes(
          existingValidateLeaves[0].leaveTypeIdx,
          leaveTypeIdx,
        );

        if (standardWorkingMinutes <= TWO_HOURS_HALF_WORKIMG_MINUTES && standardWorkingMinutes > 0) {
          throw new BadRequestException('근무 시간이 2.5시간 미만이면 사용하실 수 없습니다.');
        }
      }

      /* 보건휴가 월 사용 개수가 1이상이면 보건휴가 사용 불가 */
      if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.HEALTH_LEAVE) {
        // 보건 휴가 월 사용 개수 조회
        const healthLeaveMonthCount: number = await this.leaveRepository.getHealthLeaveCountInMonth(
          userIdx,
          year,
          month,
        );
        if (healthLeaveMonthCount !== 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }
      }

      // 신청한 특별휴무로 인해 잔여 특별휴무가 0미만이 되는 경우 사용불가
      if (SPECIAL_LEAVE_LISTS.has(leaveTypeIdx)) {
        if (totalSpecialLeaveBalance - unComfirmedSpecialReduce - leaveReduceUnit < 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }
        totalSpecialLeaveBalance -= leaveReduceUnit;
      }

      // 신청한 대체휴무로 인해 잔여 대체휴무가 0미만이 되는 경우 사용불가
      if (ALTERNATIVE_LEAVE_LISTS.has(leaveTypeIdx)) {
        if (totalAlternativeLeaveBalance - unComfirmedAlternativeReduce - leaveReduceUnit < 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }
        totalAlternativeLeaveBalance -= leaveReduceUnit;
      }

      // 신청한 연차로 인해 잔여 연차가 0미만이 되는 경우 사용불가
      if (ANNUAL_LEAVE_LISTS.has(leaveTypeIdx)) {
        if (totalAnnualLeaveBalance - unComfirmedAnnualReduce - leaveReduceUnit < 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }
        totalAnnualLeaveBalance -= leaveReduceUnit;
      }

      // 과거 날짜에 대해 휴가 등록 불가
      const today: string = moment().utcOffset(9).format('YYYY-MM-DD');
      if (commuteDate < today) {
        throw new BadRequestException('오늘 이전 날짜는 휴가 등록이 불가능합니다.');
      }

      /** 휴가등록 시작 **/
      let commuteIdx: number;
      const existingCommute = await this.leaveRepository.getCommuteInfoByDate(userIdx, commuteDate);
      // 출근 당일에 휴가를 등록할 경우,
      if (commuteDate === today) {
        // 해당 날짜에 대한 근태가 없다면 create
        if (!existingCommute) {
          leave.firstUpdatedAt = new Date();
          commuteIdx = await this.leaveRepository.createLeave(leave, userIdx, note, leaveReduceUnit);
        } else {
          // 해당 날짜에 대한 근태가 존재 & 일반 근무일 경우
          if (existingCommute.leaveTypeIdx === null) {
            commuteIdx = existingCommute.commuteIdx;
            const firstUpdatedAt = existingCommute.checkInTime ? existingCommute.firstUpdatedAt : new Date();
            await this.leaveRepository.updateLeave(
              existingCommute.commuteIdx,
              leaveTypeIdx,
              firstUpdatedAt,
              leaveReduceUnit,
            );
          } else {
            // 해당 날짜에 대한 근태가 존재 & 휴가있는 근무일 경우
            const extraUpdateInfo = existingCommute.checkInTime
              ? {
                  checkInTime: existingCommute.checkInTime,
                  attendance: existingCommute.attendance,
                  availCheckOutTime: existingCommute.availCheckOutTime,
                  firstUpdatedAt: (leave.firstUpdatedAt = new Date()),
                  checkInIpAddr: existingCommute.checkInIpAddr,
                  checkInLogAgent: existingCommute.checkInLogAgent,
                }
              : null;

            commuteIdx = await this.leaveRepository.createLeave(leave, userIdx, note, leaveReduceUnit, extraUpdateInfo);
          }
        }
      } else {
        // 미래에 대해 휴가를 등록할 경우,
        leave.firstUpdatedAt = new Date();
        commuteIdx = await this.leaveRepository.createLeave(leave, userIdx, note, leaveReduceUnit);
      }

      // 승인 가능자 모두 저장
      if (approverIdxs !== null && approverIdxs !== undefined) {
        await this.leaveRepository.createLeaveApproverList(commuteIdx, approverIdxs);
      }
      // 참조자 모두 저장
      if (ccUserIdxs !== null && ccUserIdxs !== undefined) {
        // 승인가능자는 참조자로 등록 X
        const removeDuplicateCCUserIdxs: number[] = removeDuplicateIdxs(approverIdxs, ccUserIdxs);
        await this.leaveRepository.createLeaveCCUserList(commuteIdx, removeDuplicateCCUserIdxs);
      }

      if (leaveImage) {
        const env: string = this.configService.get<string>('NODE_ENV');
        const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
        // 1. S3에 저장
        const { buffer, mimetype } = leaveImage;
        const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
        const fileName: string = mimetype === 'application/pdf' ? 'proof.pdf' : `proof.${mimetype.split('/')[1]}`;
        const uploadS3FilePath: string = `${rootDir}/LEAVE/${commuteIdx}/${fileName}`;
        const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, uploadS3FilePath, buffer, mimetype);
        const imageInfo: LeaveImageInfo = {
          imageName: fileName,
          imageSize: leaveImage.size,
          imageUrl,
        };
        // 2. DB에 저장
        await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo);
      }
    }

    return;
  }

  /*
   * 오늘 날짜 이후의 연차 내역을 삭제한다 → DELETE
   * 오늘 날짜 혹은 이전의 연차 내역을 삭제한다 → UPDATE 일반근무
   * 이미 출근을 찍었을 경우,
   */
  @Transactional()
  async deleteLeave(commuteIdx: number): Promise<void> {
    const todayDate = moment().utcOffset(9).format('YYYY-MM-DD');
    const leaveInfo = await this.leaveRepository.getLeaveInfoByIdx(commuteIdx);

    if (!leaveInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    // 오늘 날짜 이후 (미래시점)
    if (todayDate < leaveInfo.commuteDate) {
      await this.leaveRepository.deleteLeave(commuteIdx);
    } else {
      // 오늘 혹은 이전 시점
      const leaveImageInfo = await this.leaveRepository.getLeaveImageInfoByIdx(commuteIdx);
      // 승인 및 참조 및 이미지 데이터 모두 삭제
      if (leaveImageInfo.imageIdx) {
        await this.leaveRepository.deleteLeaveImage(leaveImageInfo.imageIdx);
      }
      await this.leaveRepository.deleteCommuteApprover(commuteIdx);
      await this.leaveRepository.deleteCommuteCCUser(commuteIdx);

      const restCommutes = await this.leaveRepository.getRestCommutes(
        leaveInfo.userIdx,
        leaveInfo.commuteDate,
        leaveInfo.commuteIdx,
      );

      if (restCommutes.length >= 1) {
        // commuteIdx에 해당하는 근태 외에 다른 근태가 있을 경우
        await this.leaveRepository.deleteLeave(commuteIdx);

        if (leaveInfo.checkInTime) {
          const approvedLeaves = restCommutes.filter((info) => info.confirmYN === ConfirmEnum.YES);

          let availCheckOutTime: Date;
          let attendance: IntranetAttendanceEnum;

          if (approvedLeaves.length === 2) {
            /* 삭제했을 때, 나머지가 승인된 조합 휴가일 때 */
            availCheckOutTime = calculateCombinedCommuteAvailCheckOutTime(
              leaveInfo.checkInTime,
              approvedLeaves[0].leaveTypeIdx,
              approvedLeaves[1].leaveTypeIdx,
            );
            const isAmQuarterLate =
              new Date(leaveInfo.checkInTime) >= getAmQuarterLateBoundary(new Date(leaveInfo.checkInTime));
            attendance = isAmQuarterLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
          } else if (approvedLeaves.length === 1) {
            /* 삭제했을 때, 나머지가 승인된 단일 휴가일 때 */
            availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(
              leaveInfo.checkInTime,
              approvedLeaves[0].leaveTypeIdx,
            );
            const isPmQuarterLate =
              PM_QUARTER_REST_LISTS.has(approvedLeaves[0].leaveTypeIdx) &&
              new Date(leaveInfo.checkInTime) >= getNormalLateBoundary(new Date(leaveInfo.checkInTime));

            const isAmHalfLate =
              AM_REST_LISTS.has(approvedLeaves[0].leaveTypeIdx) &&
              new Date(leaveInfo.checkInTime) >= getAmHalfLateBoundary(new Date(leaveInfo.checkInTime));

            const isPMHalfLate =
              PM_REST_LISTS.has(approvedLeaves[0].leaveTypeIdx) &&
              new Date(leaveInfo.checkInTime) >= getPmHalfLateBoundary(new Date(leaveInfo.checkInTime));

            const isAmQuarterLate =
              AM_QUARTER_REST_LISTS.has(approvedLeaves[0].leaveTypeIdx) &&
              new Date(leaveInfo.checkInTime) >= getAmQuarterLateBoundary(new Date(leaveInfo.checkInTime));

            attendance =
              isPmQuarterLate || isAmHalfLate || isPMHalfLate || isAmQuarterLate
                ? IntranetAttendanceEnum.CHECK_IN_LATE
                : IntranetAttendanceEnum.CHECK_IN;
          } else {
            /* 삭제했을 때, 나머지가 모두 미승인일 때 → 일반근무 */
            availCheckOutTime = calculateSingleCommuteAvailCheckOutTime(leaveInfo.checkInTime);

            const isNormalLate =
              new Date(leaveInfo.checkInTime) >= getNormalLateBoundary(new Date(leaveInfo.checkInTime));

            attendance = isNormalLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
          }

          const updateInfo = { attendance, availCheckOutTime };
          await this.leaveRepository.updateRestCommute(leaveInfo.userIdx, leaveInfo.commuteDate, updateInfo);
        }
      } else {
        // commuteIdx에 해당하는 근태 외에 다른 근태가 없을 경우
        let attendance: IntranetAttendanceEnum;
        if (leaveInfo.checkInTime) {
          const isNormalLate =
            new Date(leaveInfo.checkInTime) >= getNormalLateBoundary(new Date(leaveInfo.checkInTime));

          attendance = isNormalLate ? IntranetAttendanceEnum.CHECK_IN_LATE : IntranetAttendanceEnum.CHECK_IN;
        } else {
          attendance = null;
        }
        const updateInfo = {
          leaveTypeIdx: null,
          confirmYN: null,
          confirmPersonIdx: null,
          confirmDate: null,
          leaveReduceUnit: 0,
          attendance,
          availCheckOutTime: leaveInfo.checkInTime
            ? calculateSingleCommuteAvailCheckOutTime(leaveInfo.checkInTime)
            : null,
        };
        await this.leaveRepository.updateCommute(commuteIdx, updateInfo);
      }
    }

    const { userIdx, commuteDate, leaveTypeIdx } = leaveInfo;
    const { year, month } = substringYearMonth(commuteDate);
    const useCount: number = await this.approvalRepository.getTotalLeaveCountForMonth(
      year,
      month,
      userIdx,
      leaveTypeIdx,
    );

    // 월별 사용개수 업데이트
    await this.approvalRepository.updateLeaveMonthlyUseCount(year, month, userIdx, leaveTypeIdx, useCount);

    // 연도별 사용개수 업데이트
    await this.approvalRepository.updateLeaveAnnualUseCount(year, userIdx, leaveTypeIdx);

    // 연도별 연차 총 사용량 업데이트
    if (ANNUAL_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx);
    }
    // 연도별 특별휴무 총 사용량 업데이트
    if (SPECIAL_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalSpecialLeaveUsage(year, userIdx);
    }
    // 연도별 대체휴무 총 사용량 업데이트
    if (ALTERNATIVE_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalAlternativeLeaveUsage(year, userIdx);
    }

    // 식대 월별 timeoffDays 업데이트
    await this.mealRepository.updateMealTimeOffDays(year, month, userIdx);
  }

  async getLeaveSummaries({ pageNo, perPage }: PageNoDto, filterInfo: AdminLeaveFilterDto) {
    if ((filterInfo.sortby && !filterInfo.orderby) || (!filterInfo.sortby && filterInfo.orderby)) {
      throw new BadRequestException('sortby와 orderby는 함께 제공되거나 둘 다 없어야 합니다.');
    }
    const { totalPage, total, summaries } = await this.leaveRepository.getLeaveSummaries(pageNo, perPage, filterInfo);

    return { totalPage, total, summaries };
  }

  async getAnnualLeaveSummary(userIdx: number, year: string) {
    const data = await this.leaveRepository.getAnnualLeaveSummary(userIdx, year);

    return data;
  }

  async getUserLeaveStats(year: string, userIdx: number) {
    const userInfo = await this.userRepository.getUserInfoByIdx(userIdx);
    if (!userInfo) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    // 사용 휴가 수 초기화
    const leaveUsageStats: LeaveUsageStats = {
      fullLeaveUsage: 0,
      halfLeaveUsage: 0,
      quarterLeaveUsage: 0,
      specialLeaveUsage: 0,
      alternativeLeaveUsage: 0,
      sickLeaveUsage: 0,
      trainingLeaveUsage: 0,
      familyEventLeaveUsage: 0,
      healthLeaveUsage: 0,
      totalReceivedSpecialLeave: 0,
      totalReceivedAlternativeLeave: 0,
    };

    // 사용자 휴가 요약정보 조회
    const leaveStats = await this.leaveRepository.getUserLeaveStats(year, userIdx);

    if (!leaveStats) {
      return {
        leaveSummary: {
          ...userInfo,
          year,
          totalReceivedAnnualLeave: 0,
          totalAnnualLeaveUsage: 0,
          totalAnnualLeaveBalance: 0,
          yearsSinceJoin: 0,
          notConfirmLeaveCount: 0,
        },
        leaveUsageStats,
      };
    }

    const notConfirmLeaveCount: number = await this.leaveRepository.getNotConfirmLeaveCount(userIdx, year);

    const leaveSummary: LeaveSummary = {
      ...userInfo,
      year,
      totalReceivedAnnualLeave: leaveStats.totalReceivedAnnualLeave,
      totalAnnualLeaveUsage: leaveStats.totalAnnualLeaveUsage,
      yearsSinceJoin: getYearsSinceJoin(userInfo.joinDate), // 근속년수
      totalAnnualLeaveBalance: Number(leaveStats.totalAnnualLeaveBalance), // 잔여 연차 개수 (integar)
      notConfirmLeaveCount, // 대기중인 휴가 개수
    };

    // 근속년수가 3년 미만인 경우 중도입사 연차 개수를 추가
    if (leaveSummary.yearsSinceJoin < 3) {
      leaveSummary.midJoinReceivedAnnualLeave = leaveStats.midJoinReceivedAnnualLeave;
      leaveSummary.oneYearAfterJoin = getOneYearAfterJoin(userInfo.joinDate); // 만 1년 날짜
    }

    // 총 특별휴무 수, 총 대체휴무 수 추가
    leaveUsageStats.totalReceivedSpecialLeave = leaveStats.totalReceivedSpecialLeave;
    leaveUsageStats.totalReceivedAlternativeLeave = leaveStats.totalReceivedAlternativeLeave;

    // 휴가 종류별 사용현황 조회
    const leaveUsageInfo = await this.leaveRepository.getUserLeaveUsageInfo(year, userIdx);

    leaveUsageInfo.forEach((row) => {
      if (HALF_ANNUAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.halfLeaveUsage += row.annualUseCount;
      } else if (QUARTER_ANNUAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.quarterLeaveUsage += row.annualUseCount;
      } else if (SPECIAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.specialLeaveUsage = leaveStats.totalSpecialLeaveUsage;
      } else if (ALTERNATIVE_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.alternativeLeaveUsage = leaveStats.totalAlternativeLeaveUsage;
      } else if (TRAINING_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        switch (row.leaveTypeIdx) {
          case IntranetLeaveTypeIdxEnum.TRAINING:
            leaveUsageStats.trainingLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.AM_TRAINING:
            leaveUsageStats.trainingLeaveUsage += row.annualUseCount * 0.5;
            break;
          case IntranetLeaveTypeIdxEnum.PM_TRAINING:
            leaveUsageStats.trainingLeaveUsage += row.annualUseCount * 0.5;
            break;
          default:
            break;
        }
      } else {
        // 기타 휴무 유형 처리
        switch (row.leaveTypeIdx) {
          case IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE:
            leaveUsageStats.fullLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.FAMILY_EVENT_LEAVE:
            leaveUsageStats.familyEventLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.HEALTH_LEAVE:
            leaveUsageStats.healthLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.SICK_LEAVE:
            leaveUsageStats.sickLeaveUsage += row.annualUseCount;
            break;
        }
      }
    });

    const result = {
      leaveSummary,
      leaveUsageStats,
    };

    return result;
  }

  async getUserLeaveInfo(filterInfo: UserLeaveDetailFilterDto | AdminLeaveDetailFilterDto, userIdx: number) {
    const { year: filterYear, month: filterMonth, leaveTypeIdx: filterLeaveTypeIdx } = filterInfo;
    if (filterInfo.leaveTypeIdx && !Object.values(IntranetLeaveTypeIdxEnum).includes(filterInfo.leaveTypeIdx)) {
      throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
    }
    // 부여받은 총 연차 수 가져오기
    const { totalReceivedAnnualLeave } = await this.leaveRepository.getAnnualLeaveSummary(userIdx, filterInfo.year);

    /* 1. (필터없이) 연도 전체 휴가 상세정보 조회 */
    const leaveDetails = await this.leaveRepository.getUserLeaveDetail(filterYear, userIdx);

    /* 2. commuteIdx 기준 그룹화 + 참조자 및 승인자 정보 합치기 */
    const groupedLeaveDetails = await this.groupByCommuteIdx(leaveDetails);

    /* 3. 연차 차감 개수 계산 + 승인여부 필드 처리 */
    const updatedLeaveDetails = await Promise.all(
      groupedLeaveDetails.map(async (detail: any) => {
        // annualLeaveReduceUnit 설정
        detail.annualLeaveReduceUnit =
          detail.confirmYN === ConfirmEnum.YES && ANNUAL_LEAVE_LISTS.has(detail.leaveTypeIdx)
            ? detail.leaveReduceUnit
            : 0;
        // 승인여부와 날짜를 합친 새 필드 추가
        detail.confirmStatus = addConfirmStatusField(detail.confirmYN, detail.confirmDate, detail.rejectDate);

        return detail;
      }),
    );

    /* 4. 누적 잔여 연차 수 계산 */
    let remainingQuota = totalReceivedAnnualLeave;
    const withRemainingQuota = updatedLeaveDetails.map((detail) => {
      remainingQuota -= detail.annualLeaveReduceUnit;
      return {
        ...detail,
        remainingAnnualLeaveQuota: remainingQuota,
      };
    });

    /* 5. 사후 필터링 처리 (month, leaveTypeIdx, confirmYN) */
    const filtered: any[] = withRemainingQuota.filter((detail) => {
      const commuteMonth: number = moment(detail.commuteDate).utcOffset(9).month() + 1;
      const matchMonth: boolean = !filterMonth || filterMonth.includes(commuteMonth.toString());
      const matchLeaveTypeIdx = !filterLeaveTypeIdx || detail.leaveTypeIdx === filterLeaveTypeIdx;
      const matchConfirmYN =
        !('confirmYN' in filterInfo) || !filterInfo.confirmYN || detail.confirmYN === filterInfo.confirmYN;

      return matchMonth && matchLeaveTypeIdx && matchConfirmYN;
    });

    /* 6. commuteDate 기준으로 다시 내림차순 정렬 */
    const result = filtered.sort((a, b) => new Date(b.commuteDate).getTime() - new Date(a.commuteDate).getTime());

    return result;
  }

  async getAllUsersLeaveByMonth(year: string, month: string) {
    const leaveInfo = await this.leaveRepository.getAllLeaveCalender(year, month);

    // 날짜별로 그룹화하여 leaves를 구성
    const leaves: any[] = leaveInfo.reduce((acc, item) => {
      const date: string = item.commuteDate;

      if (!acc[date]) acc[date] = [];
      acc[date].push(item);

      return acc;
    }, {});

    return leaves;
  }

  @Transactional()
  async updateLeaveImage(commuteIdx: number, leaveImage: Express.Multer.File | undefined): Promise<void> {
    const env: string = this.configService.get<string>('NODE_ENV');
    const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
    const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
    const s3FolderPath: string = `${rootDir}/LEAVE/${commuteIdx}`;
    const leaveInfo = await this.leaveRepository.getLeaveImageInfoByIdx(commuteIdx);
    if (!leaveInfo) {
      throw new BadRequestException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    /* 이미지 추가 */
    if (leaveImage && !leaveInfo.imageIdx) {
      leaveImage.originalname = Buffer.from(leaveImage.originalname, 'ascii').toString('utf8');
      const { buffer, mimetype, originalname } = leaveImage;
      const s3FilePath: string = `${s3FolderPath}/${originalname}`;
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, s3FilePath, buffer, mimetype);
      const imageInfo: LeaveImageInfo = {
        imageName: originalname,
        imageSize: leaveImage.size,
        imageUrl,
      };

      await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo);
    }

    /* 이미지 수정 */
    if (leaveImage && leaveInfo.imageIdx) {
      const existingFileName: string = leaveInfo.imageName.split('/').pop();
      await this.awsService.deleteS3Image(bucketName, `${s3FolderPath}/${existingFileName}`);

      leaveImage.originalname = Buffer.from(leaveImage.originalname, 'ascii').toString('utf8');
      const { buffer, mimetype, originalname } = leaveImage;
      const s3FilePath: string = `${s3FolderPath}/${originalname}`;
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, s3FilePath, buffer, mimetype);
      const imageInfo: LeaveImageInfo = {
        imageName: originalname,
        imageSize: leaveImage.size,
        imageUrl,
      };

      await this.leaveRepository.updateLeaveImage(leaveInfo.imageIdx, imageInfo);
    }

    /* 이미지 삭제 */
    if (!leaveImage && leaveInfo.imageIdx) {
      const existingFileName: string = leaveInfo.imageName.split('/').pop();
      await this.awsService.deleteS3Image(bucketName, `${s3FolderPath}/${existingFileName}`);

      await this.leaveRepository.deleteLeaveImage(leaveInfo.imageIdx);
    }

    return;
  }

  @Transactional()
  async updateUserTotalReceivedAnnualLeave(
    leaveStatsIdx: number,
    { totalReceivedAnnualLeave }: UpdateAnnualLeaveDto,
  ): Promise<void> {
    await this.leaveRepository.updateUserTotalReceivedAnnualLeave(leaveStatsIdx, totalReceivedAnnualLeave);

    return;
  }

  @Transactional()
  async updateLeaveNote(commuteIdx: number, noteInfo: UpdateNoteDto): Promise<void> {
    await this.leaveRepository.updateLeaveNote(commuteIdx, noteInfo);

    return;
  }

  private async calculateLeaveReduceUnit(leaveTypeIdx: number) {
    switch (leaveTypeIdx) {
      case IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.AM_HALF:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.PM_HALF:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.AM_QUARTER:
        return 0.25;
      case IntranetLeaveTypeIdxEnum.PM_QUARTER:
        return 0.25;
      case IntranetLeaveTypeIdxEnum.FAMILY_EVENT_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.HEALTH_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.TRAINING:
        return 1;
      case IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.SICK_LEAVE:
        return 1;
      case IntranetLeaveTypeIdxEnum.AM_TRAINING:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.PM_TRAINING:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE:
        return 0.5;
      case IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE:
        return 0.25;
      case IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE:
        return 0.25;
      default:
        return 0;
    }
  }

  private async groupByCommuteIdx(rows: any[]) {
    return rows.reduce((acc, row) => {
      // 기존 commuteIdx가 있는지 확인
      const existing = acc.find((item: any) => item.commuteIdx === row.commuteIdx);

      const approverInfo = {
        approverIdx: row.approverIdx,
        approverName: row.approverName,
      };
      const ccUserInfo = {
        ccUserIdx: row.ccUserIdx,
        ccUserName: row.ccUserName,
      };

      if (existing) {
        // 같은 commuteIdx이면 approverInfo 리스트에 추가
        if (row.approverIdx) {
          const isIdxAlreadyExists = existing.approverInfo.some((user: any) => user.approverIdx === row.approverIdx);
          if (!isIdxAlreadyExists) {
            existing.approverInfo.push(approverInfo);
          }
        }
        // 같은 commuteIdx이면 ccUserInfo 리스트에 추가
        if (row.ccUserIdx) {
          const isIdxAlreadyExists = existing.ccUserInfo.some((user: any) => user.ccUserIdx === row.ccUserIdx);
          if (!isIdxAlreadyExists) {
            existing.ccUserInfo.push(ccUserInfo);
          }
        }
      } else {
        // 새로운 commuteIdx이면 새로운 객체 생성
        acc.push({
          commuteIdx: row.commuteIdx,
          userIdx: row.userIdx,
          commuteDate: row.commuteDate,
          commuteDayName: row.commuteDayName,
          leaveTypeIdx: row.leaveTypeIdx,
          leaveType: row.leaveType,
          imageIdx: row.imageIdx,
          imageName: row.imageName,
          imageSize: row.imageSize,
          imageUrl: row.imageUrl,
          leaveReduceUnit: row.leaveReduceUnit,
          note: row.note,
          confirmYN: row.confirmYN,
          confirmDate: row.confirmDate,
          rejectDate: row.rejectDate,
          confirmPersonIdx: row.confirmPersonIdx,
          confirmPersonName: row.confirmPersonName,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          approverInfo: row.approverIdx ? [approverInfo] : [],
          ccUserInfo: row.ccUserIdx ? [ccUserInfo] : [],
        });
      }
      return acc;
    }, []);
  }

  @Transactional()
  async createExtraLeave(adminName: string, dto: CreateExtraLeaveDto): Promise<void> {
    const { userIdx, year, leaveTypeIdx, extraLeave, note } = dto;
    if (![IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE, IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE].includes(leaveTypeIdx)) {
      throw new BadRequestException('특별휴무, 대체휴무만 선택할 수 있습니다.');
    }

    const newLeaveExtra: NewLeaveExtra = {
      userIdx,
      year,
      leaveTypeIdx,
      extraLeave,
      adminName,
      note: note ?? null,
    };

    /* 내역 추가 */
    await this.leaveRepository.createExtraLeave(newLeaveExtra);
    /* totalReceived 업데이트 */
    await this.leaveRepository.updateTotalReceivedLeave(userIdx, leaveTypeIdx, year);

    return;
  }

  @Transactional()
  async updateExtraLeave(leaveExtraIdx: number, adminName: string, dto: UpdateExtraLeaveDto): Promise<void> {
    const { userIdx, year, leaveTypeIdx, extraLeave, note } = dto;
    if (![IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE, IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE].includes(leaveTypeIdx)) {
      throw new BadRequestException('특별휴무, 대체휴무만 선택할 수 있습니다.');
    }

    const newLeaveExtra: NewLeaveExtra = {
      userIdx,
      year,
      leaveTypeIdx,
      extraLeave,
      adminName,
      note: note ?? null,
    };

    /* 내역 업데이트 */
    await this.leaveRepository.updateExtraLeave(leaveExtraIdx, newLeaveExtra);
    /* totalReceived 업데이트 */
    await this.leaveRepository.updateTotalReceivedLeave(userIdx, leaveTypeIdx, year);

    return;
  }

  @Transactional()
  async deleteExtraLeave(leaveExtraIdx: number): Promise<void> {
    /* 삭제할 내역 조회 */
    const extraInfo = await this.leaveRepository.getExtraLeaveInfoByIdx(leaveExtraIdx);
    if (!extraInfo) {
      throw new BadRequestException('이미 삭제하였거나 존재하지 않는 내역입니다.');
    }
    /* 내역 삭제 */
    await this.leaveRepository.deleteExtraLeave(leaveExtraIdx);
    /* totalReceived 업데이트 */
    const { userIdx, leaveTypeIdx, year } = extraInfo;
    await this.leaveRepository.updateTotalReceivedLeave(userIdx, leaveTypeIdx, year);
  }

  async getExtraLeaveInfo(year: string) {
    const result = await this.leaveRepository.getExtraLeaveInfoByYear(year);

    return result;
  }
}
