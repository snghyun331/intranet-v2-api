import { Injectable } from '@nestjs/common';
import { getStartAndEndDateByMonth } from '@common/utils/utility';
import { ConfirmEnum } from '@common/constant/enum';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class GlobalMealRepository {
  constructor(@InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>) {}

  async updateMealTimeOffDays(year: string, month: string, userIdx: number): Promise<UpdateResult> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const query = `(
        SELECT COUNT(DISTINCT(c.commute_date)) 
        FROM commute c
        WHERE c.user_idx = ${userIdx}
        AND c.confirm_yn = '${ConfirmEnum.YES}'
        AND c.commute_date BETWEEN '${startDate}' AND '${endDate}'
        AND c.leave_type_idx NOT IN (1,4,5,10,11)
      )`;

    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({
        timeoffDays: () => query,
      })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async updateMealBudget(year: string, month: string) {
    const query = `
        (workdays + holiday_workdays - time_off_days) * 
        (SELECT base_amount FROM meal_base WHERE meal_base.year = :year AND meal_base.month = :month)
    `;

    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ mealBudget: () => query })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }
}
