import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, InsertResult, Repository, SelectQueryBuilder } from 'typeorm';
import { LeaveDetailDto } from '../dto/createLeave.dto';
import { LeaveImageInfo } from '../interface/leave.interface';
import { ImageEntity } from '../../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../../entity/image/commuteHasImage.entity';
import { AdminLeaveFilterDto } from '../dto/query.dto';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { UserEntity } from '../../../../entity/user/user.entity';
import { GradeEntity } from '../../../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../../entity/user/team.entity';
import { IntranetLeaveTypeEnum, SortbyEnum } from '../../../../common/constant/enum';
import { removeAllWhiteSpace } from '../../../../common/utils/utility';

@Injectable()
export class LeaveRepository {
  constructor(
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
  ) {}

  async createLeave(
    leaveInfo: LeaveDetailDto,
    userIdx: number,
    confirmPersonIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ ...leaveInfo, confirmPersonIdx, userIdx })
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

  async getUserLeaveSummaries(pageNo: number, perPage: number, filterInfo: AdminLeaveFilterDto) {
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
        'leaveStatsEntity.totalAnnualLeave AS totalAnnualLeave',
        'leaveStatsEntity.annualLeaveBalance AS annualLeaveBalance',
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
    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }

    if (filterInfo.userGender) {
      query.andWhere('userEntity.userGender = :userGender', { userGender: filterInfo.userGender });
    }

    if (filterInfo.joinSDate && filterInfo.joinEDate) {
      query.andWhere('userEntity.joinDate BETWEEN :joinSDate AND :joinEDate', {
        joinSDate: filterInfo.joinSDate,
        joinEDate: filterInfo.joinEDate,
      });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    if (filterInfo.sortby && filterInfo.orderby) {
      if (filterInfo.sortby === SortbyEnum.GRADE) {
        query
          .orderBy('userEntity.gradeIdx', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.BIRTH) {
        query
          .orderBy('userEntity.userBirth', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.JOIN) {
        query
          .orderBy('userEntity.joinDate', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.TEAM) {
        query
          .orderBy('teamEntity.teamName', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else {
        throw new BadRequestException('지원하지 않는 정렬 기준입니다.');
      }
    } else {
      query
        .orderBy('userEntity.joinDate', 'DESC')
        .addOrderBy('userEntity.createdAt', 'DESC')
        .limit(perPage)
        .offset((pageNo - 1) * perPage);
    }

    const leaveStatsList = await query.getRawMany();

    // 쿼리 2: 사용자별 최근 연차사용일 데이터 함께 조회
    const lastLeaveDates = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.userIdx AS userIdx', 'MAX(commuteEntity.commuteDate) AS lastLeaveDate'])
      .where('commuteEntity.leaveType IN (:leaveType)', {
        leaveType: [
          IntranetLeaveTypeEnum.ANNUAL_LEAVE,
          IntranetLeaveTypeEnum.PM_HALF,
          IntranetLeaveTypeEnum.PM_QUARTER,
          IntranetLeaveTypeEnum.AM_HALF,
          IntranetLeaveTypeEnum.AM_QUARTER,
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
      lastLeaveDate: recentLeaveMap.has(leaveStats.userIdx) ? recentLeaveMap.get(leaveStats.userIdx) : null,
    }));

    return { totalPage, total, summaries: result };
  }
}
