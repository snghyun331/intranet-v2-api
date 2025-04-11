import * as moment from 'moment';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum, NodeEnvEnum, UserGradeEnum } from '../../../common/constant/enum';
import { AwsService } from '../../aws/aws.service';
import { LeaveImageInfo, LeaveSummary, LeaveUsageStats } from './interface/leave.interface';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto, UserLeaveDetailFilterDto } from './dto/query.dto';
import {
  addConfirmStatusField,
  getOneYearAfterJoin,
  getYearsSinceJoin,
  removeDuplicateIdxs,
  substringYearMonth,
} from '../../../common/utils/utility';
import {
  ALTERNATIVE_LEAVE_LISTS,
  ANNUAL_LEAVE_LISTS,
  HALF_ANNUAL_LEAVE_LISTS,
  QUARTER_ANNUAL_LEAVE_LISTS,
  SPECIAL_LEAVE_LISTS,
  TRAINING_LEAVE_LISTS,
} from '../../../common/constant/constant';
import { UserPayload } from '../../../common/interface/payload.interface';
import { UpdateAnnualLeaveDto } from './dto/updateAnnualLeave.dto';
import { ApprovalRepository } from '../approval/repository/approval.repository';
import { UpdateNoteDto } from './dto/updateNote.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly approvalRepository: ApprovalRepository,
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
      for (const leave of leaveInfo) {
        const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateStringFormat.test(leave.commuteDate)) {
          throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
        }
        const leaveTypeIdx: number = Number(leave.leaveTypeIdx);
        if (!Object.values(IntranetLeaveTypeIdxEnum).includes(leaveTypeIdx)) {
          throw new BadRequestException('올바른 휴가유형 IDX을 입력해주세요.');
        }

        /* 휴가등록 */
        let commuteIdx: number;
        const today: string = moment().utcOffset(9).format('YYYY-MM-DD');
        // 당일에 등록할 경우
        if (leave.commuteDate === today) {
          commuteIdx = await this.leaveRepository.getCommuteIdxByDate(userIdx, leave.commuteDate);
          await this.leaveRepository.updateLeave(commuteIdx, leave.leaveTypeIdx, manager);
        } else {
          commuteIdx = await this.leaveRepository.createLeave(leave, userIdx, note, manager);
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
        // 3. 자동승인
        await this.leaveRepository.autoApprove(commuteIdx, userIdx, manager);
      }

      return;
    }

    /* CEO 제외한 사용자의 휴가 등록 */
    for (const leave of leaveInfo) {
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
      const { totalAnnualLeaveBalance } = await this.leaveRepository.getAnnualLeaveSummary(userIdx, nowYear.toString());

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

      /* 휴가등록 */
      let commuteIdx: number;
      const today: string = moment().utcOffset(9).format('YYYY-MM-DD');
      // 당일에 등록할 경우
      if (leave.commuteDate === today) {
        commuteIdx = await this.leaveRepository.getCommuteIdxByDate(userIdx, leave.commuteDate);
        await this.leaveRepository.updateLeave(commuteIdx, leave.leaveTypeIdx, manager);
      } else {
        commuteIdx = await this.leaveRepository.createLeave(leave, userIdx, note, manager);
      }

      // 승인 가능자 모두 저장
      if (approverIdxs !== null) {
        await this.leaveRepository.createLeaveApproverList(commuteIdx, approverIdxs, manager);
      }
      // 참조자 모두 저장
      if (ccUserIdxs !== null) {
        // 승인가능자는 참조자로 등록 X
        const removeDuplicateCCUserIdxs: number[] = removeDuplicateIdxs(approverIdxs, ccUserIdxs);
        await this.leaveRepository.createLeaveCCUserList(commuteIdx, removeDuplicateCCUserIdxs, manager);
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
        await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo, manager);
      }
    }

    return;
  }

  async deleteLeave(commuteIdx: number, manager: EntityManager): Promise<void> {
    const leaveInfo = await this.leaveRepository.getLeaveInfoByIdx(commuteIdx);
    if (!leaveInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    await this.leaveRepository.deleteLeave(commuteIdx, manager);
    const { userIdx, commuteDate, leaveTypeIdx } = leaveInfo;
    const { year, month } = substringYearMonth(commuteDate);
    const useCount: number = await this.approvalRepository.getTotalLeaveCountForMonth(
      year,
      month,
      userIdx,
      leaveTypeIdx,
      manager,
    );

    // 월별 사용개수 업데이트
    await this.approvalRepository.updateLeaveMonthlyUseCount(year, month, userIdx, leaveTypeIdx, useCount, manager);

    // 연도별 사용개수 업데이트
    await this.approvalRepository.updateLeaveAnnualUseCount(year, userIdx, leaveTypeIdx, manager);

    // 연도별 연차 총 사용량 업데이트
    if (ANNUAL_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx, manager);
    }
    // 연도별 특별휴무 총 사용량 업데이트
    if (SPECIAL_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalSpecialLeaveUsage(year, userIdx, manager);
    }
    // 연도별 대체휴무 총 사용량 업데이트
    if (ALTERNATIVE_LEAVE_LISTS.has(leaveTypeIdx)) {
      await this.approvalRepository.updateTotalAlternativeLeaveUsage(year, userIdx, manager);
    }

    // 식대 월별 timeoffDays 업데이트
    await this.approvalRepository.updateMealTimeOffDays(year, month, userIdx, manager);
  }

  async getLeaveSummaries({ pageNo, perPage }: PageNoDto, filterInfo: AdminLeaveFilterDto) {
    const { totalPage, total, summaries } = await this.leaveRepository.getLeaveSummaries(pageNo, perPage, filterInfo);

    return { totalPage, total, summaries };
  }

  async getAnnualLeaveSummary(userIdx: number, year: string) {
    const data = await this.leaveRepository.getAnnualLeaveSummary(userIdx, year);

    return data;
  }

  async getUserLeaveStats(year: string, userIdx: number) {
    const userInfo = await this.leaveRepository.getUserInfoByIdx(userIdx);
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

    // 총 특별휴무 수, 총 대체휴무 수 추가 (요구사항)
    leaveUsageStats.totalReceivedSpecialLeave = leaveStats.totalReceivedSpecialLeave;
    leaveUsageStats.totalReceivedSpecialLeave = leaveStats.totalReceivedSpecialLeave;

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
          imageIdx: row.imageIdx,
          imageName: row.imageName,
          imageSize: row.imageSize,
          imageUrl: row.imageUrl,
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

    // commuteDate 기준으로 다시 내림차순 정렬
    const result = calculatedLeaveDetails.sort(
      (a, b) => new Date(b.commuteDate).getTime() - new Date(a.commuteDate).getTime(),
    );

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

  async updateLeaveImage(
    commuteIdx: number,
    leaveImage: Express.Multer.File | undefined,
    manager: EntityManager,
  ): Promise<void> {
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

      await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo, manager);
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

      await this.leaveRepository.updateLeaveImage(leaveInfo.imageIdx, imageInfo, manager);
    }

    /* 이미지 삭제 */
    if (!leaveImage && leaveInfo.imageIdx) {
      const existingFileName: string = leaveInfo.imageName.split('/').pop();
      await this.awsService.deleteS3Image(bucketName, `${s3FolderPath}/${existingFileName}`);

      await this.leaveRepository.deleteLeaveImage(leaveInfo.imageIdx, manager);
    }

    return;
  }

  async updateUserTotalReceivedAnnualLeave(
    leaveStatsIdx: number,
    { totalReceivedAnnualLeave }: UpdateAnnualLeaveDto,
    manager: EntityManager,
  ): Promise<void> {
    await this.leaveRepository.updateUserTotalReceivedAnnualLeave(leaveStatsIdx, totalReceivedAnnualLeave, manager);

    return;
  }

  async updateLeaveStatsNote(leaveStatsIdx: number, noteInfo: UpdateNoteDto, manager: EntityManager): Promise<void> {
    const leaveStatsCnt: number = await this.leaveRepository.getLeaveStatsCountByIdx(leaveStatsIdx);
    if (leaveStatsCnt < 1) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    await this.leaveRepository.updateLeaveStatsNote(leaveStatsIdx, noteInfo, manager);

    return;
  }
}
