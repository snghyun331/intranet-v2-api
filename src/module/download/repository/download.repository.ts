import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { Repository } from 'typeorm';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { getStartAndEndDateByMonth } from '../../../common/utils/utility';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { MealStatsAdminInfo } from '../../meal/interface/meal.interface';

@Injectable()
export class DownloadRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
  ) {}

  async getUserNameByIdx(userIdx: number): Promise<{ userName: string }> {
    const result: { userName: string } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getRawOne();

    return result;
  }

  async getMealList(year: number, month: number, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select([])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawMany();

    return result;
  }

  async getMealStatsList(year: string, month: string): Promise<MealStatsAdminInfo[]> {
    const result = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.mealExpense AS mealExpense',
        'mealStatsEntity.mealBalance AS mealBalance',
        'mealStatsEntity.breakfastExpense AS breakfastExpense',
        'mealStatsEntity.dinnerExpense AS dinnerExpense',
        'mealStatsEntity.breakfastOverpay AS breakfastOverpay',
        'mealStatsEntity.dinnerOverpay AS dinnerOverpay',
        'mealStatsEntity.note AS note',
        'mealStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .orderBy('userEntity.gradeIdx', 'ASC')
      .getRawMany();

    return result;
  }
}
