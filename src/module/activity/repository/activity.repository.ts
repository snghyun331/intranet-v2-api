import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, EntityManager, InsertResult, Repository, UpdateResult } from 'typeorm';
import { CreateActivityDto } from '../dto/createActivity.dto';
import { ActivityEntity } from '../../../entity/activity/activity.entity';
import { getStartAndEndDateByMonth } from '../../../common/utils/utility';
import { ActivityMonthlyStatsEntity } from '../../../entity/activity/activityMonthlyStats.entity';
import { UpdateActivityDto } from '../dto/updateActivity.dto';
import { ActivityInfo } from '../interface/activity.interface';

@Injectable()
export class ActivityRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(ActivityEntity) private readonly activityModel: Repository<ActivityEntity>,
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

  async getUserIdxByName(userName: string): Promise<{ userIdx: number }> {
    const result: { userIdx: number } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userName = :userName', { userName })
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
    year: number,
    month: number,
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
    year: number,
    month: number,
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
}
