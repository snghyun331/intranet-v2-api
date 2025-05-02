import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../../entity/user/user.entity';
import { Repository } from 'typeorm';
import { MealEntity } from '../../../../entity/meal/meal.entity';
import { getStartAndEndDateByMonth } from '../../../../common/utils/utility';
import { MealStatsEntity } from '../../../../entity/meal/mealStats.entity';
import { GradeEntity } from '../../../../entity/user/grade.entity';
import { HalfYearEnum } from '../../../../common/constant/enum';
import { WelfareStatsEntity } from '../../../../entity/welfare/welfareStats.entity';

@Injectable()
export class DownloadRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(WelfareStatsEntity) private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
  ) {}

  async getUserNameByIdx(userIdx: number): Promise<{ userName: string }> {
    const result: { userName: string } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async getMealList(year: string, month: string, userIdx: number) {
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

  async getMealStatsList(year: string, month: string) {
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
        'mealStatsEntity.totalOverpay AS totalOverpay',
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

  async getWelfareStatsList(year: string, halfYear: HalfYearEnum) {
    const result = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select([
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'welfareStatsEntity.welfareBudget AS welfareBudget',
        'welfareStatsEntity.welfareExpense AS welfareExpense',
        'welfareStatsEntity.welfareBalance AS welfareBalance',
        'welfareStatsEntity.totalOverpay AS totalOverpay',
        'welfareStatsEntity.note AS note',
        'welfareStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('welfareStatsEntity.year = :year', { year })
      .andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear })
      .orderBy('userEntity.gradeIdx', 'ASC')
      .getRawMany();

    return result;
  }
}
