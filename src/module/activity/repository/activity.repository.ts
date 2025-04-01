import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CreateActivityDto } from '../dto/createActivity.dto';
import { ActivityEntity } from '../../../entity/activity/activity.entity';
import {
  getStartAndEndDateByHalfYear,
  getStartAndEndDateByMonth,
  removeAllWhiteSpace,
} from '../../../common/utils/utility';
import { ActivityMonthlyStatsEntity } from '../../../entity/activity/activityMonthlyStats.entity';
import { UpdateActivityDto } from '../dto/updateActivity.dto';
import {
  Activities,
  ActivityInfo,
  ActivityStats,
  ActivityStatsAdminInfo,
  AdminActivity,
  NewActivityMonthStats,
  NewActivityStats,
} from '../interface/activity.interface';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { UserPayload } from '../../../common/interface/payload.interface';
import { ClearStatusEnum, ConfirmEnum, HalfYearEnum } from '../../../common/constant/enum';
import { ActivityStatsEntity } from '../../../entity/activity/activityStats.entity';
import { AdminActivityFilterDto } from '../dto/query.dto';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { CreateActivityBudgetDto } from '../dto/createBudget.dto';
import { ActivityBudgetAdminResult } from '../interface/result.interface';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { UpdateBudgetDto } from '../dto/updateBudget.dto';

@Injectable()
export class ActivityRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(ActivityEntity) private readonly activityModel: Repository<ActivityEntity>,
    @InjectRepository(ActivityStatsEntity) private readonly activityStatsModel: Repository<ActivityStatsEntity>,
    @InjectRepository(ActivityMonthlyStatsEntity)
    private readonly activityMonthStatsModel: Repository<ActivityMonthlyStatsEntity>,
  ) {}

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getAllUserNames(): Promise<string[]> {
    const result: { userName: string }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    const allNames: string[] = result.map((r) => r.userName);

    return allNames;
  }

  async getUserIdxByName(userName: string): Promise<any> {
    const result: any = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.gradeIdx AS gradeIdx', 'userEntity.teamIdx AS teamIdx'])
      .where('userEntity.userName = :userName', { userName })
      .andWhere('userEntity.userAvail IS NULL')
      .getRawOne();

    return result;
  }

  async createActivity(
    userIdx: number,
    newActivityInfo: CreateActivityDto,
    manager: EntityManager,
  ): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(ActivityEntity)
      .values({ userIdx, ...newActivityInfo })
      .execute();
  }

  async getTotalActivityExpense(
    year: string,
    month: string,
    payerName: string,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await manager
      .createQueryBuilder(ActivityEntity, 'activityEntity')
      .select('SUM(activityEntity.amount)', 'total')
      .where('activityEntity.payerName = :payerName', { payerName })
      .andWhere('activityEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result.total || 0;
  }

  async updateMonthlyActivityStats(
    activityMonthExpense: number,
    year: string,
    month: string,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityMonthlyStatsEntity)
      .set({ activityMonthExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getActivityInfoByIdx(activityIdx: number): Promise<ActivityInfo> {
    const result: ActivityInfo = await this.activityModel
      .createQueryBuilder('activityEntity')
      .select([
        'activityEntity.activityIdx AS activityIdx',
        'activityEntity.userIdx AS userIdx',
        'activityEntity.targetDay AS targetDay',
        'activityEntity.payerName AS payerName',
      ])
      .where('activityEntity.activityIdx = :activityIdx', { activityIdx })
      .getRawOne();

    return result;
  }

  async updateActivity(
    activityIdx: number,
    updateActivityInfo: UpdateActivityDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityEntity)
      .set(updateActivityInfo)
      .where('activityIdx = :activityIdx', { activityIdx })
      .execute();
  }

  async deleteActivity(activityIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(ActivityEntity)
      .where('activityIdx = :activityIdx', { activityIdx })
      .execute();
  }

  async getHalfYearActivities(year: string, halfYear: HalfYearEnum, user: UserPayload) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByHalfYear(year, halfYear);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const query: SelectQueryBuilder<ActivityEntity> = this.activityModel
      .createQueryBuilder('activityEntity')
      .select([
        'activityEntity.activityIdx AS activityIdx',
        'activityEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'activityEntity.targetDay AS targetDay',
        'activityEntity.content AS content',
        'activityEntity.amount AS amount',
        'activityEntity.payerName AS payerName',
        'activityEntity.confirmYN AS confirmYN',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = activityEntity.userIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('activityEntity.targetDay BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (user.hqName) {
      query.andWhere('hqEntity.hqName = :hqName', { hqName: user.hqName });
    } else if (user.teamName) {
      query.andWhere('teamEntity.teamName = :teamName', { teamName: user.teamName });
    }

    query.orderBy('activityEntity.targetDay', 'DESC').addOrderBy('activityEntity.createdAt', 'DESC');

    const result: Activities[] = await query.getRawMany();

    return result;
  }

  async getActivityStats(year: string, halfYear: HalfYearEnum, user: UserPayload): Promise<ActivityStats> {
    const defaultResult: ActivityStats = {
      year,
      halfYear,
      activityBudget: 0,
      activityExpense: 0,
      activityBalance: 0,
      hqName: user.hqName,
      teamName: user.teamName,
    };

    const query: SelectQueryBuilder<ActivityStatsEntity> = this.activityStatsModel
      .createQueryBuilder('activityStatsEntity')
      .select([
        'activityStatsEntity.year AS year',
        'activityStatsEntity.halfYear AS halfYear',
        'activityStatsEntity.activityBudget AS activityBudget',
        'activityStatsEntity.activityExpense AS activityExpense',
        '(activityStatsEntity.activityBudget - activityStatsEntity.activityExpense) AS activityBalance',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = activityStatsEntity.userIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('activityStatsEntity.year = :year', { year })
      .andWhere('activityStatsEntity.halfYear = :halfYear', { halfYear });

    if (user.hqName) {
      query.andWhere('hqEntity.hqName = :hqName', { hqName: user.hqName });
    } else if (user.teamName) {
      query.andWhere('teamEntity.teamName = :teamName', { teamName: user.teamName });
    }
    const statsInfo = await query.getRawOne();

    if (!statsInfo) {
      return defaultResult;
    }

    const result: ActivityStats = { ...statsInfo, activityBalance: Number(statsInfo.activityBalance) };

    return result;
  }

  async getActivity(pageNo: number, perPage: number, filterInfo: AdminActivityFilterDto) {
    const query: SelectQueryBuilder<ActivityEntity> = this.activityModel
      .createQueryBuilder('activityEntity')
      .select([
        'activityEntity.activityIdx AS activityIdx',
        'activityEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'activityEntity.targetDay AS targetDay',
        'activityEntity.content AS content',
        'activityEntity.amount AS amount',
        'activityEntity.payerName AS payerName',
        'activityEntity.confirmYN AS confirmYN',
        'activityEntity.confirmDate AS confirmDate',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = activityEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('activityEntity.targetDay BETWEEN :sDate AND :eDate', {
        sDate: filterInfo.sDate,
        eDate: filterInfo.eDate,
      })
      .andWhere('userEntity.userAvail IS NULL');

    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }
    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }
    if (filterInfo.confirmYN) {
      query.andWhere('activityEntity.confirmYN = :confirmYN', { confirmYN: filterInfo.confirmYN });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('activityEntity.targetDay', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result: AdminActivity[] = await query.getRawMany();

    return { totalPage, total, activity: result };
  }

  async getActivityStatsCount({ period, userIdx }: CreateActivityBudgetDto, year: string) {
    const statsCnt: number = await this.activityStatsModel
      .createQueryBuilder('activityStatsEntity')
      .where('activityStatsEntity.year = :year', { year })
      .andWhere('activityStatsEntity.halfYear = :halfYear', { halfYear: period })
      .andWhere('activityStatsEntity.userIdx = :userIdx', { userIdx })
      .getCount();

    return statsCnt;
  }

  async createActivityMonthStats(monthStatsInfo: NewActivityMonthStats, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(ActivityMonthlyStatsEntity)
      .values({ ...monthStatsInfo })
      .execute();
  }

  async createActivityStats(statsInfo: NewActivityStats, manager: EntityManager): Promise<InsertResult> {
    return await manager.createQueryBuilder().insert().into(ActivityStatsEntity).values(statsInfo).execute();
  }

  async getAdminActivityBudget(year: string, halfYear: HalfYearEnum): Promise<ActivityBudgetAdminResult[]> {
    const result: ActivityBudgetAdminResult[] = await this.activityStatsModel
      .createQueryBuilder('activityStatsEntity')
      .select([
        'activityStatsEntity.activityStatsIdx AS activityStatsIdx',
        'activityStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'activityStatsEntity.activityBudget AS activityBudget',
        'activityStatsEntity.note AS note',
        'activityStatsEntity.memberCount AS memberCount',
        'activityStatsEntity.budgetPerMember AS budgetPerMember',
        'activityStatsEntity.extraBudget AS extraBudget',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = activityStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('activityStatsEntity.year = :year', { year })
      .andWhere('activityStatsEntity.halfYear = :halfYear', { halfYear })
      .andWhere('userEntity.userAvail IS NULL')
      .orderBy('userEntity.gradeIdx', 'ASC')
      .addOrderBy('userEntity.userName', 'ASC')
      .getRawMany();

    return result;
  }

  async getActivityStatsCountByIdx(activityStatsIdx: number): Promise<number> {
    const statsCnt: number = await this.activityStatsModel
      .createQueryBuilder('activityStatsEntity')
      .where('activityStatsEntity.activityStatsIdx = :activityStatsIdx', { activityStatsIdx })
      .getCount();

    return statsCnt;
  }

  async updateActivityBudget(
    activityStatsIdx: number,
    budgetInfo: UpdateBudgetDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityStatsEntity)
      .set(budgetInfo)
      .where('activityStatsIdx = :activityStatsIdx', { activityStatsIdx })
      .execute();
  }

  async updateActivityStatsNote(
    activityStatsIdx: number,
    { note }: UpdateNoteDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityStatsEntity)
      .set({ note })
      .where('activityStatsIdx = :activityStatsIdx', { activityStatsIdx })
      .execute();
  }

  async updateConfirmActivity(activityIdx: number, confirmYN: ConfirmEnum, manager: EntityManager): Promise<void> {
    if (confirmYN === ConfirmEnum.YES) {
      const confirmDate: Date = new Date();
      await manager
        .createQueryBuilder()
        .update(ActivityEntity)
        .set({ confirmYN, confirmDate })
        .where('activityIdx = :activityIdx', { activityIdx })
        .execute();
    } else {
      await manager
        .createQueryBuilder()
        .update(ActivityEntity)
        .set({ confirmYN, confirmDate: null })
        .where('activityIdx = :activityIdx', { activityIdx })
        .execute();
    }
  }

  async getUserActivityStats(year: string, halfYear?: HalfYearEnum): Promise<ActivityStatsAdminInfo[]> {
    const query: SelectQueryBuilder<ActivityStatsEntity> = this.activityStatsModel
      .createQueryBuilder('activityStatsEntity')
      .select([
        'activityStatsEntity.activityStatsIdx AS activityStatsIdx',
        'activityStatsEntity.year AS year',
        'activityStatsEntity.halfYear AS halfYear',
        'activityStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'activityStatsEntity.activityBudget AS activityBudget',
        'activityStatsEntity.activityExpense AS activityExpense',
        '(activityStatsEntity.activityBudget - activityStatsEntity.activityExpense) AS activityBalance',
        'activityStatsEntity.totalOverpay AS totalOverpay',
        'activityStatsEntity.note AS note',
        'activityStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = activityStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('activityStatsEntity.year = :year', { year })
      .andWhere('userEntity.userAvail IS NULL');

    if (halfYear) {
      query.andWhere('activityStatsEntity.halfYear = :halfYear', { halfYear });
    }

    query.orderBy('userEntity.gradeIdx', 'ASC').addOrderBy('activityStatsEntity.halfYear', 'ASC');

    const userStatsInfo = await query.getRawMany();

    const result: ActivityStatsAdminInfo[] = userStatsInfo.map((stats) => ({
      ...stats,
      activityBalance: Number(stats.activityBalance),
    }));

    return result;
  }

  async updateClearStatusComplete(activityStatsIdx: number, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityStatsEntity)
      .set({ clearStatus: ClearStatusEnum.COMPLETE })
      .where('activityStatsIdx = :activityStatsIdx', { activityStatsIdx })
      .execute();
  }

  async updateClearStatusNotYet(activityStatsIdx: number, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(ActivityStatsEntity)
      .set({ clearStatus: ClearStatusEnum.NOT_YET })
      .where('activityStatsIdx = :activityStatsIdx', { activityStatsIdx })
      .execute();
  }

  async getActivityMonthStatsCnt(userIdx: number, year: string, month: string): Promise<number> {
    const statsCnt: number = await this.activityMonthStatsModel
      .createQueryBuilder('activityMonthStatsEntity')
      .where('activityMonthStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('activityMonthStatsEntity.year = :year', { year })
      .andWhere('activityMonthStatsEntity.month = :month', { month })
      .getCount();

    return statsCnt;
  }

  async updateActivityExpense(
    year: string,
    month: string,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    if (Number(month) > 7) {
      const query = `(
        SELECT COALESCE(SUM(activity_month_expense), 0) 
        FROM activity_monthly_stats  
        WHERE activity_monthly_stats.user_idx = activity_stats.user_idx 
        AND activity_monthly_stats.year = activity_stats.year
        AND activity_monthly_stats.month IN ('7','8','9','10','11','12')
      )`;

      return await manager
        .createQueryBuilder()
        .update(ActivityStatsEntity)
        .set({ activityExpense: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('halfYear = :halfYear', { halfYear: HalfYearEnum.H2 })
        .execute();
    } else {
      const query = `(
        SELECT COALESCE(SUM(activity_month_expense), 0) 
        FROM activity_monthly_stats  
        WHERE activity_monthly_stats.user_idx = activity_stats.user_idx 
        AND activity_monthly_stats.year = activity_stats.year
        AND activity_monthly_stats.month IN ('1','2','3','4','5','6')
      )`;

      return await manager
        .createQueryBuilder()
        .update(ActivityStatsEntity)
        .set({ activityExpense: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('halfYear = :halfYear', { halfYear: HalfYearEnum.H1 })
        .execute();
    }
  }
}
