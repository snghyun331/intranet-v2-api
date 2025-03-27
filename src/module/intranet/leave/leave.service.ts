import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum, NodeEnvEnum, UserGradeEnum } from '../../../common/constant/enum';
import { AwsService } from '../../aws/aws.service';
import { LeaveImageInfo, LeaveSummary } from './interface/leave.interface';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto } from './dto/query.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { addConfirmStatusField, getOneYearAfterJoin, getYearsSinceJoin } from '../../../common/utils/utility';
import {
  ALTERNATIVE_LEAVE_LISTS,
  HALF_ANNUAL_LEAVE_LISTS,
  QUARTER_ANNUAL_LEAVE_LISTS,
  SPECIAL_LEAVE_LISTS,
  TRAINING_LEAVE_LISTS,
} from '../../../common/constant/constant';
import { UserPayload } from '../../../common/interface/payload.interface';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  async createLeave(
    dto: LeaveRequestDto,
    user: UserPayload,
    manager: EntityManager,
    leaveImage?: Express.Multer.File,
  ): Promise<void> {
    const userIdx: number = user.userIdx;
    const { leaveInfo, approverIdxs, ccUserIdxs, note } = dto;
    const nowYear: number = moment().utcOffset(9).year();
    const nowMonth: number = moment().utcOffset(9).month() + 1;

    /* CEO이면, 아무 조건 없이 휴가 등록 및 자동승인 */
    if (user.gradeName === UserGradeEnum.CEO) {
      await Promise.all(
        leaveInfo.map(async (leave) => {
          const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateStringFormat.test(leave.commuteDate)) {
            throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
          }
          const leaveTypeIdx: number = Number(leave.leaveTypeIdx);
          if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leaveTypeIdx)) {
            throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
          }
          // 휴가등록
          const commuteIdx: number = await this.leaveRepository.createLeave(leave, userIdx, note, manager);
          if (leaveImage) {
            const env: string = this.configService.get<string>('NODE_ENV');
            const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
            // 1. S3에 저장
            const { buffer, mimetype } = leaveImage;
            const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
            const fileName: string = mimetype === 'application/pdf' ? 'proof.pdf' : `proof.${mimetype.split('/')[1]}`;
            const uploadS3FilePath: string = `${rootDir}/LEAVE/${commuteIdx}/${fileName}`;
            const imageUrl: string = await this.awsService.uploadImageToS3(
              bucketName,
              uploadS3FilePath,
              buffer,
              mimetype,
            );
            const imageInfo: LeaveImageInfo = {
              imageName: fileName,
              imageSize: leaveImage.size,
              imageUrl,
            };
            // 2. DB에 저장
            await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo, manager);
          }
          // 3. 자동승인
          await this.leaveRepository.autoApprove(commuteIdx, userIdx, manager);
        }),
      );

      return;
    }

    await Promise.all(
      leaveInfo.map(async (leave) => {
        const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateStringFormat.test(leave.commuteDate)) {
          throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
        }
        const leaveTypeIdx: number = Number(leave.leaveTypeIdx);
        if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leaveTypeIdx)) {
          throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
        }

        // 보건휴가 월 사용 개수가 1이상이면 보건휴가 사용 불가
        if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.HEALTH_LEAVE) {
          // 보건 휴가 월 사용 개수 조회
          const { healthMonthlyUseCount } = await this.leaveRepository.getHealthMonthlyUseCount(
            userIdx,
            nowYear.toString(),
            nowMonth.toString(),
          );
          if (healthMonthlyUseCount !== 0) {
            throw new BadRequestException(
              '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
            );
          }
        }

        // 연차 잔여 개수 조회
        const { totalAnnualLeaveBalance } = await this.leaveRepository.getAnnualLeaveSummary(
          userIdx,
          nowYear.toString(),
        );

        // 잔여 연차가 1미만이면 연차 사용 불가
        if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE) {
          if (totalAnnualLeaveBalance < 1) {
            throw new BadRequestException(
              '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
            );
          }
        }

        // 잔여 연차가 0.5미만이면 반차 사용 불가
        if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.AM_HALF || leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_HALF) {
          if (totalAnnualLeaveBalance < 0.5) {
            throw new BadRequestException(
              '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
            );
          }
        }

        // 잔여 연차가 0.25미만이면 반반차 사용 불가
        if (
          leaveTypeIdx === IntranetLeaveTypeIdxEnum.AM_QUARTER ||
          leaveTypeIdx === IntranetLeaveTypeIdxEnum.PM_QUARTER
        ) {
          if (totalAnnualLeaveBalance < 0.25) {
            throw new BadRequestException(
              '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
            );
          }
        }

        const commuteIdx: number = await this.leaveRepository.createLeave(leave, userIdx, note, manager);
        // 승인 가능자 모두 저장
        if (approverIdxs !== null) {
          await this.leaveRepository.createLeaveApproverList(commuteIdx, approverIdxs, manager);
        }
        // 참조자 모두 저장
        if (ccUserIdxs !== null) {
          await this.leaveRepository.createLeaveCCUserList(commuteIdx, ccUserIdxs, manager);
        }

        if (leaveImage) {
          const env: string = this.configService.get<string>('NODE_ENV');
          const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
          // 1. S3에 저장
          const { buffer, mimetype } = leaveImage;
          const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
          const fileName: string = mimetype === 'application/pdf' ? 'proof.pdf' : `proof.${mimetype.split('/')[1]}`;
          const uploadS3FilePath: string = `${rootDir}/LEAVE/${commuteIdx}/${fileName}`;
          const imageUrl: string = await this.awsService.uploadImageToS3(
            bucketName,
            uploadS3FilePath,
            buffer,
            mimetype,
          );
          const imageInfo: LeaveImageInfo = {
            imageName: fileName,
            imageSize: leaveImage.size,
            imageUrl,
          };
          // 2. DB에 저장
          await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo, manager);
        }
      }),
    );

    return;
  }

  async deleteLeave(commuteIdx: number, manager: EntityManager): Promise<void> {
    const commuteCount: number = await this.leaveRepository.getCommuteCountByIdx(commuteIdx);
    if (commuteCount !== 1) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    await this.leaveRepository.deleteLeave(commuteIdx, manager);
  }

  async getLeaveSummaries({ pageNo, perPage }: PageNoDto, filterInfo: AdminLeaveFilterDto) {
    const { totalPage, total, summaries } = await this.leaveRepository.getLeaveSummaries(pageNo, perPage, filterInfo);

    return { totalPage, total, summaries };
  }

  async getAnnualLeaveSummary(userIdx: number, year: string) {
    const data = await this.leaveRepository.getAnnualLeaveSummary(userIdx, year);

    return data;
  }

  async updateLeaveStatsNote(leaveStatsIdx: number, noteInfo: UpdateNoteDto, manager: EntityManager): Promise<void> {
    const leaveStatsCnt: number = await this.leaveRepository.getLeaveStatsCountByIdx(leaveStatsIdx);
    if (leaveStatsCnt < 1) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    await this.leaveRepository.updateLeaveStatsNote(leaveStatsIdx, noteInfo, manager);

    return;
  }

  async getUserLeaveStats(year: string, userIdx: number) {
    const userCnt: number = await this.leaveRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    // 사용자 휴가 요약정보 조회
    const leaveStats = await this.leaveRepository.getUserLeaveStats(year, userIdx);

    if (!leaveStats) {
      return { leaveSummary: {}, leaveUsageStats: {} };
    }

    const leaveSummary: LeaveSummary = {
      ...leaveStats,
      yearsSinceJoin: getYearsSinceJoin(leaveStats.joinDate), // 근속년수
      oneYearAfterJoin: getOneYearAfterJoin(leaveStats.joinDate), // 만 1년 날짜
      totalAnnualLeaveBalance: Number(leaveStats.totalAnnualLeaveBalance), // 잔여 연차 개수 (integar)
    };

    // 근속년수가 3년 미만인 경우 중도입사 연차 개수를 추가
    if (leaveSummary.yearsSinceJoin < 3) {
      leaveSummary.midJoinReceivedAnnualLeave = leaveSummary.midJoinReceivedAnnualLeave;
    }

    // 휴가 종류별 사용현황 조회
    const leaveUsageInfo = await this.leaveRepository.getUserLeaveUsageInfo(year, userIdx);

    const leaveUsageStats = {
      fullLeaveUsage: 0,
      halfLeaveUsage: 0,
      quarterLeaveUsage: 0,
      specialLeaveUsage: 0,
      alternativeLeaveUsage: 0,
      sickLeaveUsage: 0,
      trainingLeaveUsage: 0,
      familyEventLeaveUsage: 0,
      healthLeaveUsage: 0,
    };

    leaveUsageInfo.forEach((row) => {
      if (HALF_ANNUAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.halfLeaveUsage += row.annualUseCount;
      } else if (QUARTER_ANNUAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        leaveUsageStats.quarterLeaveUsage += row.annualUseCount;
      } else if (SPECIAL_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        switch (row.leaveTypeIdx) {
          case IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE:
            leaveUsageStats.specialLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE:
            leaveUsageStats.specialLeaveUsage += row.annualUseCount * 0.5;
            break;
          case IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE:
            leaveUsageStats.specialLeaveUsage += row.annualUseCount * 0.5;
            break;
          case IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE:
            leaveUsageStats.specialLeaveUsage += row.annualUseCount * 0.25;
            break;
          case IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE:
            leaveUsageStats.specialLeaveUsage += row.annualUseCount * 0.25;
            break;
          default:
            break;
        }
      } else if (ALTERNATIVE_LEAVE_LISTS.has(row.leaveTypeIdx)) {
        switch (row.leaveTypeIdx) {
          case IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE:
            leaveUsageStats.alternativeLeaveUsage += row.annualUseCount;
            break;
          case IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE:
            leaveUsageStats.alternativeLeaveUsage += row.annualUseCount * 0.5;
            break;
          case IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE:
            leaveUsageStats.alternativeLeaveUsage += row.annualUseCount * 0.5;
            break;
          default:
            break;
        }
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

  async getUserLeaveInfo(filterInfo: AdminLeaveDetailFilterDto, userIdx: number) {
    if (filterInfo.leaveTypeIdx && !Object.values(IntranetLeaveTypeIdxEnum).includes(filterInfo.leaveTypeIdx)) {
      throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
    }
    // 부여받은 총 연차 수 가져오기
    const { totalReceivedAnnualLeave } = await this.leaveRepository.getAnnualLeaveSummary(userIdx, filterInfo.year);

    // 휴가 상세내역 정보 가져오기
    const leaveDetails = await this.leaveRepository.getUserLeaveDetail(filterInfo, userIdx);

    // 데이터를 commuteIdx 기준으로 그룹화
    const leaveDetailsWithApprovers = leaveDetails.reduce((acc, row) => {
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
          annualLeaveReduceUnit: row.annualLeaveReduceUnit,
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

    const updatedLeaveDetails = await Promise.all(
      leaveDetailsWithApprovers.map(async (leaveDetail: any) => {
        // leaveReduceUnit 재설정
        leaveDetail.annualLeaveReduceUnit =
          leaveDetail.confirmYN === ConfirmEnum.YES ? leaveDetail.annualLeaveReduceUnit : 0;
        // 승인여부와 날짜를 합친 새 필드 추가
        const confirmStatus: string = addConfirmStatusField(
          leaveDetail.confirmYN,
          leaveDetail.confirmDate,
          leaveDetail.rejectDate,
        );

        return {
          ...leaveDetail,
          confirmStatus,
        };
      }),
    );

    // 누적 잔여 연차 수 계산
    let remainingAnnualLeaveQuota: number = totalReceivedAnnualLeave;
    const calculatedLeaveDetails = updatedLeaveDetails.map((leaveDetail) => {
      remainingAnnualLeaveQuota -= leaveDetail.annualLeaveReduceUnit;
      return {
        ...leaveDetail,
        remainingAnnualLeaveQuota,
      };
    });

    const result = calculatedLeaveDetails.sort(
      (a, b) => new Date(b.commuteDate).getTime() - new Date(a.commuteDate).getTime(),
    );

    return result;
  }

  async getAllUsersLeaveByDate(date: string) {
    const leaveList = await this.leaveRepository.getAllUsersLeaveByDate(date);
    const leaveByType = {};

    leaveList.forEach(({ leaveType, userName }) => {
      leaveByType[leaveType] = leaveByType[leaveType] || [];
      leaveByType[leaveType].push(userName);
    });

    return { date, leaveByType };
  }
}
