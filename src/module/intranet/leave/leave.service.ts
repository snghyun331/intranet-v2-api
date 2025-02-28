import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { IntranetLeaveTypeIdxEnum, NodeEnvEnum } from '../../../common/constant/enum';
import { AwsService } from '../../aws/aws.service';
import { LeaveImageInfo, LeaveSummary } from './interface/leave.interface';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto } from './dto/query.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';

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
    const { leaveInfo, confirmPersonIdx } = dto;

    await Promise.all(
      leaveInfo.map(async (leave) => {
        const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateStringFormat.test(leave.commuteDate)) {
          throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
        }
        if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leave.leaveTypeIdx)) {
          throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
        }
        const commuteIdx: number = await this.leaveRepository.createLeave(leave, userIdx, confirmPersonIdx, manager);

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

  async getLeaveSummaries({ pageNo, perPage }: PageNoDto, filterInfo: AdminLeaveFilterDto) {
    const { totalPage, total, summaries } = await this.leaveRepository.getLeaveSummaries(pageNo, perPage, filterInfo);

    return { totalPage, total, summaries };
  }

  async getLeaveSummary(userIdx: number) {
    const data = await this.leaveRepository.getLeaveSummary(userIdx);

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

    const result = await this.leaveRepository.getUserLeaveDetail(filterInfo, userIdx);

    return result;
  }

  async getAllUsersLeaveByDate(date: string) {
    const leaveList = await this.leaveRepository.getAllUsersLeaveByDate(date);

    const result = {
      date,
      leaveList,
    };

    return result;
  }
}
