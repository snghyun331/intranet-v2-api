import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { Repository } from 'typeorm';
import { MealDto, MealInfoDto, MealStatsDto } from '../dto/meal.dto';
import { CreateMealDto } from '../dto/createMeal.dto';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { AttendanceEnum, YNEnum } from '../../../common/constant/enum';

@Injectable()
export class MealRepository {
  constructor(
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
  ) {}

  async getMeal(year: number, month: number, userIdx: number): Promise<MealDto[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: MealDto[] = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.useDate AS useDate',
        'mealEntity.attendance AS attendance',
        'mealEntity.dinerName AS dinerName',
        'mealEntity.payAmount AS payAmount',
        'mealEntity.payer AS payer',
      ])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.useDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('mealEntity.useDate', 'DESC')
      .getRawMany();

    return result;
  }

  async getMealStats(year: number, month: number, userIdx: number): Promise<MealStatsDto> {
    const result: MealStatsDto = await this.mealStatsModel
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

  async getUserCount(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getCount();

    return userCnt;
  }

  async createMeal(userIdx: number, mealInfo: CreateMealDto): Promise<void> {
    return this.mealModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(MealEntity)
        .values({ userIdx, ...mealInfo })
        .execute();
    });
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

  async getTotalTimeoffDays(year: number, month: number, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: number = await this.mealModel
      .createQueryBuilder('mealEntity')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.attendance NOT IN (:...attendance)', {
        attendance: [AttendanceEnum.WORKING, AttendanceEnum.REMOTE_WORK],
      })
      .andWhere('mealEntity.useDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();

    return result;
  }

  async updateTimeOffDaysInStats(timeoffDays: number, year: number, month: number, userIdx: number): Promise<void> {
    return this.mealStatsModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(MealStatsEntity)
        .set({ timeoffDays })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('month = :month', { month })
        .execute();
    });
  }

  async getTotalMealExpense(year: number, month: number, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select('SUM(mealEntity.pay_amount)', 'total')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.useDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result.total;
  }

  async updateMealExpenseInStats(mealExpense: number, year: number, month: number, userIdx: number) {
    return this.mealStatsModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(MealStatsEntity)
        .set({ mealExpense })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('month = :month', { month })
        .execute();
    });
  }

  async getTotalHolidayWorkdays(year: number, month: number, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: number = await this.mealModel
      .createQueryBuilder('mealEntity')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.useDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.attendance IN (:...attendance)', {
        attendance: [AttendanceEnum.WORKING, AttendanceEnum.REMOTE_WORK],
      })
      .andWhere('mealEntity.holidayYN = :holidayYN', { holidayYN: YNEnum.YES })
      .getCount();

    return result;
  }

  async updateHolidayWorkdaysInStats(
    holidayWorkdays: number,
    year: number,
    month: number,
    userIdx: number,
  ): Promise<void> {
    return this.mealStatsModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(MealStatsEntity)
        .set({ holidayWorkdays })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('month = :month', { month })
        .execute();
    });
  }

  async deleteMeal(mealIdx: number): Promise<void> {
    return this.mealModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().delete().from(MealEntity).where('mealIdx = :mealIdx', { mealIdx }).execute();
    });
  }

  async getMealInfoByIdx(mealIdx: number): Promise<MealInfoDto> {
    const result: MealInfoDto = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['mealEntity.mealIdx AS mealIdx', 'mealEntity.userIdx AS userIdx', 'mealEntity.useDate AS useDate'])
      .where('mealEntity.mealIdx = :mealIdx', { mealIdx })
      .getRawOne();

    return result;
  }
}
