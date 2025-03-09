import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { LeaveDetailDto } from '../dto/createLeave.dto';
import { LeaveImageInfo } from '../interface/leave.interface';
import { ImageEntity } from '../../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../../entity/image/commuteHasImage.entity';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto } from '../dto/query.dto';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { UserEntity } from '../../../../entity/user/user.entity';
import { GradeEntity } from '../../../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../../entity/user/team.entity';
import { IntranetLeaveTypeIdxEnum } from '../../../../common/constant/enum';
import {
  getOneYearAfterJoin,
  getStartAndEndDateByMonth,
  getYearsSinceJoin,
  removeAllWhiteSpace,
} from '../../../../common/utils/utility';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { LeaveTypeEntity } from '../../../../entity/intranet/leave/leaveType.entity';
import { LeaveMontlyStatsEntity } from '../../../../entity/intranet/leave/leaveMonthlyStats.entity';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';

@Injectable()
export class LeaveRepository {
  constructor(
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
    @InjectRepository(LeaveMontlyStatsEntity)
    private readonly leaveMonthlyStatsModel: Repository<LeaveMontlyStatsEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
  ) {}

  async getLeaveStatsCountByIdx(leaveStatsIdx: number): Promise<number> {
    const result: number = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .where('leaveStatsEntity.leaveStatsIdx = :leaveStatsIdx', { leaveStatsIdx })
      .getCount();

    return result;
  }

  async createLeave(
    leaveInfo: LeaveDetailDto,
    userIdx: number,
    note: string | null,
    manager: EntityManager,
  ): Promise<number> {
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ ...leaveInfo, note, userIdx })
      .execute();

    const commuteIdx: number = result.identifiers[0].commuteIdx;

    return commuteIdx;
  }

  async createLeaveImage(commuteIdx: number, imageInfo: LeaveImageInfo, manager: EntityManager): Promise<void> {
    /* image entity */
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(ImageEntity)
      .values(imageInfo)
      .execute();

    const imageIdx: number = result.identifiers[0].imageIdx;

    /* leave_has_image entity */
    await manager.createQueryBuilder().insert().into(CommuteHasImageEntity).values({ commuteIdx, imageIdx }).execute();
  }

  async getAnnualLeaveSummary(userIdx: number, year: string) {
    const result = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.year AS year',
        'leaveStatsEntity.userIdx AS userIdx',
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance',
      ])
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    result.totalAnnualLeaveBalance = Number(result.totalAnnualLeaveBalance);

    return result;
  }

  async getLeaveSummaries(pageNo: number, perPage: number, filterInfo: AdminLeaveFilterDto) {
    // 쿼리 1: 전체 사용자 연차 정보
    const query: SelectQueryBuilder<LeaveStatsEntity> = this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.leaveStatsIdx AS leaveStatsIdx',
        'leaveStatsEntity.userIdx AS userIdx',
        'userEntity.joinDate AS joinDate',
        'userEntity.userName AS userName',
        'userEntity.userEmail AS userEmail',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'leaveStatsEntity.year AS year',
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance',
        'leaveStatsEntity.note AS note',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = leaveStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('leaveStatsEntity.year = :year', { year: filterInfo.year });

    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('userEntity.joinDate', 'DESC')
      .addOrderBy('userEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const leaveStatsList = await query.getRawMany();

    // 쿼리 2: 사용자별 최근 연차사용일 데이터 함께 조회
    const lastLeaveDates = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.userIdx AS userIdx', 'MAX(commuteEntity.commuteDate) AS lastLeaveDate'])
      .where('commuteEntity.leaveTypeIdx IN (:leaveTypeIdx)', {
        leaveTypeIdx: [
          IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE,
          IntranetLeaveTypeIdxEnum.PM_HALF,
          IntranetLeaveTypeIdxEnum.PM_QUARTER,
          IntranetLeaveTypeIdxEnum.AM_HALF,
          IntranetLeaveTypeIdxEnum.AM_QUARTER,
        ],
      })
      .groupBy('commuteEntity.userIdx')
      .getRawMany();

    const recentLeaveMap = new Map<number, string>();

    lastLeaveDates.forEach(({ userIdx, lastLeaveDate }) => {
      recentLeaveMap.set(userIdx, lastLeaveDate);
    });

    const result = leaveStatsList.map((leaveStats) => ({
      userIdx: leaveStats.userIdx,
      ...leaveStats,
      totalAnnualLeaveBalance: Number(leaveStats.totalAnnualLeaveBalance),
      lastLeaveDate: recentLeaveMap.has(leaveStats.userIdx) ? recentLeaveMap.get(leaveStats.userIdx) : null,
    }));

    return { totalPage, total, summaries: result };
  }

  async updateLeaveStatsNote(
    leaveStatsIdx: number,
    { note }: UpdateNoteDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({ note })
      .where('leaveStatsIdx = :leaveStatsIdx', { leaveStatsIdx })
      .execute();
  }

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getUserLeaveStats(year: string, userIdx: number) {
    const leaveStats = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'userEntity.userName AS userName',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave', // 총 연차 개수
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage', // 사용 연차 개수
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance', // 잔여 연차 개수
        'leaveStatsEntity.midJoinReceivedAnnualLeave AS midJoinReceivedAnnualLeave', // 중도입사 연차 부여개수
        'leaveStatsEntity.fullLeaveUsage AS fullLeaveUsage',
        'leaveStatsEntity.halfLeaveUsage AS halfLeaveUsage',
        'leaveStatsEntity.quarterLeaveUsage AS quarterLeaveUsage',
        'leaveStatsEntity.specialLeaveUsage AS specialLeaveUsage',
        'leaveStatsEntity.alternativeLeaveUsage AS alternativeLeaveUsage',
        'leaveStatsEntity.sickLeaveUsage AS sickLeaveUsage',
        'leaveStatsEntity.trainingLeaveUsage AS trainingLeaveUsage',
        'leaveStatsEntity.familyEventLeaveUsage AS familyEventLeaveUsage',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = leaveStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    const result = {
      ...leaveStats,
      yearsSinceJoin: getYearsSinceJoin(leaveStats.joinDate), // 근속년수
      oneYearAfterJoin: getOneYearAfterJoin(leaveStats.joinDate), // 만 1년 날짜
      totalAnnualLeaveBalance: Number(leaveStats.totalAnnualLeaveBalance), // 잔여 연차 개수 (integar)
    };

    return result;
  }

  async getUserLeaveDetail({ year, month, ...filter }: AdminLeaveDetailFilterDto, userIdx: number) {
    // 해당 월의 첫 번째 날과 마지막 날을 구함
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(Number(year), Number(month));
    const firstDayOfMonthToString: string = firstDayOfMonth.format('YYYY-MM-DD');
    const lastDayOfMonthToString: string = lastDayOfMonth.format('YYYY-MM-DD');

    const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'DAYNAME(commuteEntity.commuteDate) AS commuteDayName',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'leaveTypeEntity.leaveReduceUnit AS annualLeaveReduceUnit',
        'commuteEntity.note AS note',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.confirmDate AS confirmDate',
        'commuteEntity.rejectDate AS rejectDate',
        'commuteEntity.confirmPersonIdx AS confirmPersonIdx',
        'confirmUserEntity.userName AS confirmPersonName',
        'commuteEntity.createdAt AS createdAt',
        'commuteEntity.updatedAt AS updatedAt',

        // 추가: 승인 가능자 정보 가져오기
        'commuteApproverEntity.userIdx AS approverIdx',
        'approverUserEntity.userName AS approverName',
      ])
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .leftJoin(UserEntity, 'confirmUserEntity', 'confirmUserEntity.userIdx = commuteEntity.confirmPersonIdx')
      .leftJoin(
        CommuteApproverEntity,
        'commuteApproverEntity',
        'commuteApproverEntity.commuteIdx = commuteEntity.commuteIdx',
      )
      .leftJoin(UserEntity, 'approverUserEntity', 'approverUserEntity.userIdx = commuteApproverEntity.userIdx')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate BETWEEN :firstDayOfMonthToString AND :lastDayOfMonthToString', {
        firstDayOfMonthToString,
        lastDayOfMonthToString,
      });

    if (filter.leaveTypeIdx) {
      query.andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', { leaveTypeIdx: filter.leaveTypeIdx });
    } else {
      query.andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', {
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      });
    }

    const result = await query.getRawMany();

    return result;
  }

  async getAllUsersLeaveByDate(date: string) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['userEntity.userName AS userName', 'leaveTypeEntity.leaveType AS leaveType'])
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = commuteEntity.userIdx')
      .where('commuteEntity.commuteDate = :date', { date })
      .andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', { leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL })
      .getRawMany();

    return result;
  }

  async getHealthMonthlyUsage(userIdx: number, year: string, month: string) {
    const result = await this.leaveMonthlyStatsModel
      .createQueryBuilder('leaveMonthlyStatsEntity')
      .select(['leaveMonthlyStatsEntity.healthMonthlyUsage AS healthMonthlyUsage'])
      .where('leaveMonthlyStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveMonthlyStatsEntity.year = :year', { year })
      .andWhere('leaveMonthlyStatsEntity.month = :month', { month })
      .getRawOne();
    console.log(result);
    return result;
  }

  async createLeaveApproverList(commuteIdx: number, userIdxs: number[], manager: EntityManager) {
    await Promise.all(
      userIdxs.map(async (userIdx) => {
        await manager
          .createQueryBuilder()
          .insert()
          .into(CommuteApproverEntity)
          .values({ commuteIdx, userIdx })
          .execute();
      }),
    );

    return;
  }
}
