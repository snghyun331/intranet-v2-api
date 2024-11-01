import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { DeleteResult, EntityManager, InsertResult, Repository, UpdateResult } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { AttendanceEnum, MealTypeEnum, YNEnum } from '../../../common/constant/enum';
import { DetailedMealData, MealStats } from '../interface/meal.interface';

@Injectable()
export class MealRepository {
  constructor(
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
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

  async getMealCalender(year: number, month: number, userIdx: number): Promise<MealEntity[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: MealEntity[] = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.mealIdx AS mealIdx',
        'mealEntity.userIdx AS userIdx',
        'mealEntity.targetDay AS targetDay',
        'mealEntity.holidayYN AS holidayYN',
        'mealEntity.attendance AS attendance',
        'mealEntity.mealType AS mealType',
        'mealEntity.place AS place',
        'mealEntity.amount AS amount',
        'mealEntity.payerName AS payerName',
      ])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('mealEntity.targetDay', 'ASC')
      .getRawMany();

    return result;
  }

  async getMealStats(year: number, month: number, userIdx: number): Promise<MealStats> {
    const result: MealStats = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.year AS year',
        'mealStatsEntity.month AS month',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.mealExpense AS mealExpense',
        'mealStatsEntity.mealBalance AS mealBalance',
        'userEntity.userName AS userName',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .where('mealStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .getRawOne();

    return result;
  }

  async createMeal(
    userIdx: number,
    targetDay: string,
    newMealInfo: DetailedMealData,
    mealType: MealTypeEnum,
    manager: EntityManager,
  ): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(MealEntity)
      .values({ userIdx, targetDay, mealType, ...newMealInfo })
      .execute();
  }

  async getMonthHolidays(year: number, month: number): Promise<string[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: HolidayEntity[] = await this.holidayModel
      .createQueryBuilder('holidayEntity')
      .select([
        'holidayEntity.holidayIdx AS holidayIdx',
        'holidayEntity.holidayDate AS holidayDate',
        'holidayEntity.holidayName AS holidayName',
      ])
      .where('holidayEntity.holidayDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawMany();

    const monthHolidays: string[] = result.map((r) => r.holidayDate);

    return monthHolidays;
  }

  async getTotalTimeoffDays(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: any = await manager
      .createQueryBuilder(MealEntity, 'mealEntity')
      .select('COUNT(DISTINCT(mealEntity.targetDay))', 'count')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.attendance NOT IN (:...attendance)', {
        attendance: [AttendanceEnum.WORKING],
      })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result.count;
  }

  async updateTimeOffDaysInStats(
    timeoffDays: number,
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ timeoffDays })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getTotalMealExpense(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await manager
      .createQueryBuilder(MealEntity, 'mealEntity')
      .select('COALESCE(SUM(mealEntity.amount), 0)', 'total') // null일 경우 0으로
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.mealType = :mealType', { mealType: MealTypeEnum.LUNCH })
      .getRawOne();

    return result.total || 0;
  }

  async updateMealExpenseInStats(
    mealExpense: number,
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ) {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ mealExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getTotalHolidayWorkdays(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: any = await manager
      .createQueryBuilder(MealEntity, 'mealEntity')
      .select('COUNT(DISTINCT(mealEntity.targetDay))', 'count')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.attendance IN (:...attendance)', {
        attendance: [AttendanceEnum.WORKING],
      })
      .andWhere('mealEntity.holidayYN = :holidayYN', { holidayYN: YNEnum.YES })
      .getRawOne();

    return result.count;
  }

  async updateHolidayWorkdaysInStats(
    holidayWorkdays: number,
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ holidayWorkdays })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async deleteMeal(userIdx: number, targetDay: string, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(MealEntity)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('targetDay = :targetDay', { targetDay })
      .execute();
  }

  async updateMeal(mealIdx: number, updateMealInfo: DetailedMealData, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealEntity)
      .set(updateMealInfo)
      .where('mealIdx = :mealIdx', { mealIdx })
      .execute();
  }

  async getTotalBreakfastExpense(
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await manager
      .createQueryBuilder(MealEntity, 'mealEntity')
      .select('COALESCE(SUM(mealEntity.amount), 0)', 'total') // null일 경우 0으로
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.mealType = :mealType', { mealType: MealTypeEnum.BREAKFAST })
      .getRawOne();

    return result.total || 0;
  }

  async updateBreakfastExpenseInStats(
    breakfastExpense: number,
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ breakfastExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getTotalDinnerExpense(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await manager
      .createQueryBuilder(MealEntity, 'mealEntity')
      .select('COALESCE(SUM(mealEntity.amount), 0)', 'total') // null일 경우 0으로
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.mealType = :mealType', { mealType: MealTypeEnum.DINNER })
      .getRawOne();

    return result.total || 0;
  }

  async updateDinnerExpenseInStats(
    dinnerExpense: number,
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ dinnerExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMealIdx(userIdx: number, targetDay: string, mealType: MealTypeEnum): Promise<any> {
    const result: any = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['mealEntity.mealIdx AS mealIdx'])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.mealType = :mealType', { mealType })
      .andWhere('mealEntity.targetDay = :targetDay', { targetDay })
      .getRawOne();

    return result;
  }
}
