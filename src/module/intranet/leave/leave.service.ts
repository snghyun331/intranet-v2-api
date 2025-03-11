import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum, NodeEnvEnum } from '../../../common/constant/enum';
import { AwsService } from '../../aws/aws.service';
import { LeaveImageInfo, LeaveSummary } from './interface/leave.interface';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto } from './dto/query.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { addConfirmStatusField } from '../../../common/utils/utility';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  async createLeave(
    dto: LeaveRequestDto,
    userIdx: number,
    manager: EntityManager,
    leaveImage?: Express.Multer.File,
  ): Promise<void> {
    console.log(dto);
    const { leaveInfo, approverIdxs, note } = dto;
    const nowYear: number = moment().utcOffset(9).year();
    const nowMonth: number = moment().utcOffset(9).month() + 1;
    // 보건 휴가 월 사용 개수 조회
    const { healthMonthlyUsage } = await this.leaveRepository.getHealthMonthlyUsage(
      userIdx,
      nowYear.toString(),
      nowMonth.toString(),
    );
    // 연차 잔여 개수 조회
    const { totalAnnualLeaveBalance } = await this.leaveRepository.getAnnualLeaveSummary(userIdx, nowYear.toString());

    await Promise.all(
      leaveInfo.map(async (leave) => {
        const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateStringFormat.test(leave.commuteDate)) {
          throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
        }
        if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leave.leaveTypeIdx)) {
          throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
        }

        // 보건휴가 월 사용 개수가 1이상이면 보건휴가 사용 불가
        if (leave.leaveTypeIdx === IntranetLeaveTypeIdxEnum.HEALTH_LEAVE && healthMonthlyUsage !== 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }
        // 잔여 연차가 0개이면 연차 사용 불가
        if (leave.leaveTypeIdx === IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE && totalAnnualLeaveBalance === 0) {
          throw new BadRequestException(
            '현재 사용 가능한 휴가/연차 개수가 확인되지 않습니다. 남은 개수를 확인하시거나, P&C팀에 문의하세요.',
          );
        }

        const commuteIdx: number = await this.leaveRepository.createLeave(leave, userIdx, note, manager);
        if (approverIdxs !== null) {
          await this.leaveRepository.createLeaveApproverList(commuteIdx, approverIdxs, manager);
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

    /* 사용자 휴가 요약정보와 휴가 종류별 사용현황 조회 */
    const {
      userName,
      joinDate,
      hqName,
      teamName,
      gradeName,
      totalReceivedAnnualLeave,
      totalAnnualLeaveUsage,
      totalAnnualLeaveBalance,
      midJoinReceivedAnnualLeave,
      yearsSinceJoin,
      oneYearAfterJoin,
      proRatedAnnualLeave,
      ...leaveUsageStats
    } = await this.leaveRepository.getUserLeaveStats(year, userIdx);

    const leaveSummary: LeaveSummary = {
      userIdx,
      userName,
      year,
      joinDate,
      hqName,
      teamName,
      gradeName,
      totalReceivedAnnualLeave,
      totalAnnualLeaveUsage,
      totalAnnualLeaveBalance,
      yearsSinceJoin,
      oneYearAfterJoin,
      proRatedAnnualLeave,
    };
    // 근속년수가 3년 미만인 경우 중도입사 연차 개수를 추가
    if (yearsSinceJoin < 3) {
      leaveSummary.midJoinReceivedAnnualLeave = midJoinReceivedAnnualLeave;
    }

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
      if (existing) {
        // 같은 commuteIdx이면 approverInfo 리스트에 추가
        if (row.approverIdx) {
          existing.approverInfo.push(approverInfo);
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
    const result = updatedLeaveDetails.map((leaveDetail) => {
      remainingAnnualLeaveQuota -= leaveDetail.annualLeaveReduceUnit;

      return {
        ...leaveDetail,
        remainingAnnualLeaveQuota,
      };
    });

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
