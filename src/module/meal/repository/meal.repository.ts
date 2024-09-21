import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { Repository } from 'typeorm';
import { MealDto, MealStatsDto } from '../dto/meal.dto';
import { CreateMealDto } from '../dto/createMeal.dto';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';

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
    const firstDayOfMonthToString: string = firstDayOfMonth.format('YYYY-MM-DD');
    const lastDayOfMonthToString: string = lastDayOfMonth.format('YYYY-MM-DD');
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
      .andWhere('mealEntity.useDate BETWEEN :firstDayOfMonthToString AND :lastDayOfMonthToString', {
        firstDayOfMonthToString,
        lastDayOfMonthToString,
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
    await this.mealModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(MealEntity)
        .values({ userIdx, ...mealInfo })
        .execute();
    });
  }

  async getMonthHolidays(): Promise<string[]> {
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, nowMonth);
    const firstDayOfMonthToString: string = firstDayOfMonth.format('YYYY-MM-DD');
    const lastDayOfMonthToString: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: HolidayEntity[] = await this.holidayModel
      .createQueryBuilder('holidayEntity')
      .select('*')
      .where('holidayEntity.holidayDate BETWEEN :firstDayOfMonthToString AND :lastDayOfMonthToString', {
        firstDayOfMonthToString,
        lastDayOfMonthToString,
      })
      .getRawMany();

    const monthHolidays: string[] = result.map((r) => r.holidayDate);

    return monthHolidays;
  }
}
