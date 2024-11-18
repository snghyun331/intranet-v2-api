import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getStartAndEndDateByMonth } from '../../../common/utils/utility';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { AttendanceEnum, ClearStatusEnum, GradeIdxEnum, MealTypeEnum, YNEnum } from '../../../common/constant/enum';
import {
  DetailedMealData,
  MealAdminInfo,
  MealBudgetAdminInfo,
  MealStats,
  MealStatsAdminInfo,
} from '../interface/meal.interface';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { MealAdminResult, MealBudgetTotalPageInfo } from '../interface/result.interface';
import { AdminMealFilterDto, AdminMealBudgetFilterDto } from '../dto/query.dto';
import { CreateMealBudgetDto } from '../dto/createBudget.dto';
import { NewMealStats } from '../../scheduler/interface/meal.interface';
import { MealBaseEntity } from '../../../entity/meal/mealBase.entity';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { PageNoDto } from '../../../common/dto/pageNo.dto';

@Injectable()
export class MealRepository {
  constructor(
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(MealBaseEntity) private readonly mealBaseModel: Repository<MealBaseEntity>,
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

  async getAllUserIdxExceptCEO(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userAvail IS NULL')
      .andWhere('userEntity.gradeIdx != :gradeIdx', { gradeIdx: GradeIdxEnum.CEO })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async getUserCountByName(userName: string): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userName = :userName', { userName })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getHolidayDates(year: number, month: number): Promise<string[]> {
    // 해당 월의 첫 번째 날과 마지막 날을 구함
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const firstDayOfMonthToString: string = firstDayOfMonth.format('YYYY-MM-DD');
    const lastDayOfMonthToString: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: HolidayEntity[] = await this.holidayModel
      .createQueryBuilder('holidayEntity')
      .select([
        'holidayEntity.holidayIdx AS holidayIdx',
        'holidayEntity.holidayDate AS holidayDate',
        'holidayEntity.holidayName AS holidayName',
      ])
      .where('holidayEntity.holidayDate BETWEEN :firstDayOfMonthToString AND :lastDayOfMonthToString', {
        firstDayOfMonthToString,
        lastDayOfMonthToString,
      })
      .getRawMany();

    const holidayDates: string[] = result.map((r) => r.holidayDate);

    return holidayDates;
  }

  async getMyMealCalender(year: number, month: number, userIdx: number): Promise<MealEntity[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async getMyMealStats(year: number, month: number, userIdx: number): Promise<MealStats> {
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

  async createMyMeal(
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
      .values({ userIdx, targetDay, mealType, amount: Number(newMealInfo.amount), ...newMealInfo })
      .execute();
  }

  async getMonthHolidays(year: number, month: number): Promise<string[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async getMyTotalTimeoffDays(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async updateMyTimeOffDaysInStats(
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

  async getMyTotalMealExpense(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async updateMyMealExpenseInStats(
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

  async getMyTotalHolidayWorkdays(
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async updateMyHolidayWorkdaysInStats(
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

  async deleteMyMeal(userIdx: number, targetDay: string, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(MealEntity)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('targetDay = :targetDay', { targetDay })
      .execute();
  }

  async updateMyMeal(mealIdx: number, updateMealInfo: DetailedMealData, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealEntity)
      .set(updateMealInfo)
      .where('mealIdx = :mealIdx', { mealIdx })
      .execute();
  }

  async getMyTotalBreakfastExpense(
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async updateMyBreakfastExpenseInStats(
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

  async getMyTotalDinnerExpense(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
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

  async updateMyDinnerExpenseInStats(
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

  async getMealIdx(userIdx: number, targetDay: string, mealType: MealTypeEnum): Promise<{ mealIdx: number }> {
    const result: { mealIdx: number } = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['mealEntity.mealIdx AS mealIdx'])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.mealType = :mealType', { mealType })
      .andWhere('mealEntity.targetDay = :targetDay', { targetDay })
      .getRawOne();

    return result;
  }

  async getMeal(pageNo: number, perPage: number, searchInfo: AdminMealFilterDto): Promise<MealAdminResult> {
    const query: SelectQueryBuilder<MealEntity> = this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.mealIdx AS mealIdx',
        'gradeEntity.gradeName AS gradeName',
        'mealEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'mealEntity.place AS place',
        'mealEntity.targetDay AS targetDay',
        'mealEntity.mealType AS mealType',
        'mealEntity.amount AS amount',
        'mealEntity.payerName AS payerName',
        'mealEntity.attendance AS attendance',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('mealEntity.targetDay BETWEEN :sDate AND :eDate', {
        sDate: searchInfo.sDate,
        eDate: searchInfo.eDate,
      })
      .andWhere('mealEntity.amount IS NOT NULL');

    if (searchInfo.userName) {
      query.andWhere('userEntity.userName = :userName', { userName: searchInfo.userName });
    }

    const total = await query.getCount();
    const totalPage = Math.ceil(total / perPage);

    query
      .orderBy('mealEntity.targetDay', 'DESC')
      .addOrderBy('userEntity.userName', 'ASC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result: MealAdminInfo[] = await query.getRawMany();

    return { totalPage, total, meal: result };
  }

  async getMealStatsCount(year: string, month: string): Promise<number> {
    const statsCnt: number = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .getCount();

    return statsCnt;
  }

  async createMealBudget(
    mealBudgetInfo: CreateMealBudgetDto,
    newMealStatsInfo: NewMealStats,
    manager: EntityManager,
  ): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(MealStatsEntity)
      .values({ ...mealBudgetInfo, ...newMealStatsInfo })
      .execute();
  }

  async updateMealBudget(
    { year, month, mealBudget }: CreateMealBudgetDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ mealBudget })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMealBaseInfo(year: string, month: string): Promise<{ baseAmount: number }> {
    const result: { baseAmount: number } = await this.mealBaseModel
      .createQueryBuilder('mealBaseEntity')
      .select(['mealBaseEntity.baseAmount AS baseAmount'])
      .where('mealBaseEntity.year = :year', { year })
      .andWhere('mealBaseEntity.month = :month', { month })
      .getRawOne();

    return result;
  }

  async createMealBase(year: string, month: string, baseAmount: number, manager: EntityManager): Promise<InsertResult> {
    console.log(baseAmount);
    return await manager
      .createQueryBuilder()
      .insert()
      .into(MealBaseEntity)
      .values({ year, month, baseAmount })
      .execute();
  }

  async updateMealBase(year: string, month: string, baseAmount: number, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealBaseEntity)
      .set({ baseAmount })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getAdminMealBudget(
    { perPage, pageNo }: PageNoDto,
    filterInfo: AdminMealBudgetFilterDto,
  ): Promise<MealBudgetTotalPageInfo> {
    const { year, month } = filterInfo;
    const query: SelectQueryBuilder<MealStatsEntity> = this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.mealStatsIdx AS mealStatsIdx',
        'mealStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.note AS note',
        'mealStatsEntity.year AS year',
        'mealStatsEntity.month AS month',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .innerJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month });

    const total = await query.getCount();
    const totalPage = Math.ceil(total / perPage);

    query
      .orderBy('userEntity.gradeIdx', 'ASC')
      .addOrderBy('userEntity.userName', 'ASC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result: MealBudgetAdminInfo[] = await query.getRawMany();

    return { totalPage, total, mealBudget: result };
  }

  async updateMealStatsNote(
    mealStatsIdx: number,
    { note }: UpdateNoteDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ note })
      .where('mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .execute();
  }

  async getMealStatsCountByIdx(mealStatsIdx: number): Promise<number> {
    const statsCnt: number = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .where('mealStatsEntity.mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .getCount();

    return statsCnt;
  }

  async getUserMealStats(year: string, month: string): Promise<MealStatsAdminInfo[]> {
    const result: MealStatsAdminInfo[] = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.mealStatsIdx AS mealStatsIdx',
        'mealStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.mealExpense AS mealExpense',
        'mealStatsEntity.mealBalance AS mealBalance',
        'mealStatsEntity.breakfastExpense AS breakfastExpense',
        'mealStatsEntity.dinnerExpense AS dinnerExpense',
        'mealStatsEntity.note AS note',
        'mealStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .innerJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .getRawMany();

    return result;
  }

  async updateClearStatusComplete(mealStatsIdx: number, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ clearStatus: ClearStatusEnum.COMPLETE })
      .where('mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .execute();
  }

  async updateClearStatusNotYet(mealStatsIdx: number, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ clearStatus: ClearStatusEnum.NOT_YET })
      .where('mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .execute();
  }
}
