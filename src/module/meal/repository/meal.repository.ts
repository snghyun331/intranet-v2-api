import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getStartAndEndDateByMonth } from '@common/utils/utility';
import { MealEntity } from '@entity/meal/meal.entity';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { UserEntity } from '@entity/user/user.entity';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { HolidayEntity } from '@entity/scheduler/holiday.entity';
import { ClearStatusEnum, MealTypeEnum, YNEnum } from '@common/constant/enum';
import { DetailedMealData, MealStats } from '../interface/meal.interface';
import { GradeEntity } from '@entity/user/grade.entity';
import { AdminMealFilterDto, AdminMealBudgetFilterDto } from '../dto/query.dto';
import { NewMealStats } from '@scheduler/interface/mealStats.interface';
import { MealBaseEntity } from '@entity/meal/mealBase.entity';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_DINNER_RATE } from '@common/constant/constant';
import { TeamEntity } from '@entity/user/team.entity';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { LeaveTypeEntity } from '@entity/intranet/leave/leaveType.entity';

@Injectable()
export class MealRepository {
  constructor(
    @InjectRepository(MealEntity) private readonly mealModel: Repository<MealEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(MealBaseEntity) private readonly mealBaseModel: Repository<MealBaseEntity>,
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
  ) {}

  async getMyMealCalender(year: string, month: string, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.mealIdx AS mealIdx',
        'mealEntity.userIdx AS userIdx',
        'mealEntity.targetDay AS targetDay',
        'mealEntity.holidayYN AS holidayYN',
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

  async getMyMealStats(year: string, month: string, userIdx: number) {
    const defaultResult: MealStats = {
      year,
      month,
      mealBudget: 0,
      mealExpense: 0,
      mealBalance: 0,
    };

    const myStatsInfo = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.year AS year',
        'mealStatsEntity.month AS month',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.mealExpense AS mealExpense',
        '(mealStatsEntity.mealBudget - mealStatsEntity.mealExpense) AS mealBalance',
        'userEntity.userName AS userName',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .where('mealStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .getRawOne();

    if (!myStatsInfo) {
      return defaultResult;
    }

    const result: MealStats = myStatsInfo ? { ...myStatsInfo, mealBalance: Number(myStatsInfo.mealBalance) } : {};

    return result;
  }

  async createMyMeal(
    userIdx: number,
    targetDay: string,
    newMealInfo: DetailedMealData,
    mealType: MealTypeEnum,
  ): Promise<InsertResult> {
    return await this.mealModel
      .createQueryBuilder()
      .insert()
      .into(MealEntity)
      .values({ userIdx, targetDay, mealType, amount: Number(newMealInfo.amount), ...newMealInfo })
      .execute();
  }

  async getMonthHolidays(year: string, month: string): Promise<string[]> {
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

  async getMyTotalMealExpense(year: string, month: string, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.mealModel
      .createQueryBuilder('mealEntity')
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

  async updateMyMealExpenseInStats(mealExpense: number, year: string, month: string, userIdx: number) {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ mealExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMyTotalHolidayWorkdays(year: string, month: string, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: any = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select('COUNT(DISTINCT(mealEntity.targetDay))', 'count')
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.holidayYN = :holidayYN', { holidayYN: YNEnum.YES })
      .getRawOne();

    return result.count;
  }

  async updateMyHolidayWorkdaysInStats(
    holidayWorkdays: number,
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ holidayWorkdays })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async deleteMyMeal(userIdx: number, targetDay: string): Promise<DeleteResult> {
    return await this.mealModel
      .createQueryBuilder()
      .delete()
      .from(MealEntity)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('targetDay = :targetDay', { targetDay })
      .execute();
  }

  async updateMyMeal(mealIdx: number, updateMealInfo: DetailedMealData): Promise<UpdateResult> {
    return await this.mealModel
      .createQueryBuilder()
      .update(MealEntity)
      .set(updateMealInfo)
      .where('mealIdx = :mealIdx', { mealIdx })
      .execute();
  }

  async getMyTotalBreakfastExpense(year: string, month: string, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.mealModel
      .createQueryBuilder('mealEntity')
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
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ breakfastExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMyTotalDinnerExpense(year: string, month: string, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.mealModel
      .createQueryBuilder('mealEntity')
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
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ dinnerExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMealIdx(userIdx: number, targetDay: string, mealType: MealTypeEnum) {
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['mealEntity.mealIdx AS mealIdx'])
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.mealType = :mealType', { mealType })
      .andWhere('mealEntity.targetDay = :targetDay', { targetDay })
      .getRawOne();

    return result;
  }

  async getMeal(pageNo: number, perPage: number, searchInfo: AdminMealFilterDto) {
    const query: SelectQueryBuilder<MealEntity> = this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.mealIdx AS mealIdx',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'mealEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'mealEntity.place AS place',
        'mealEntity.targetDay AS targetDay',
        'mealEntity.mealType AS mealType',
        'mealEntity.amount AS amount',
        'mealEntity.payerName AS payerName',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealEntity.userIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .innerJoin(
        CommuteEntity,
        'commuteEntity',
        'commuteEntity.userIdx = mealEntity.userIdx AND commuteEntity.commuteDate = mealEntity.targetDay',
      )
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .where('mealEntity.targetDay BETWEEN :sDate AND :eDate', {
        sDate: searchInfo.sDate,
        eDate: searchInfo.eDate,
      })
      .andWhere('mealEntity.amount IS NOT NULL')
      .andWhere('userEntity.userAvail IS NULL');

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

    const result = await query.getRawMany();

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

  async createMealStats(newMealStats: NewMealStats): Promise<InsertResult> {
    return await this.mealStatsModel.createQueryBuilder().insert().into(MealStatsEntity).values(newMealStats).execute();
  }

  async updateMealStats(newMealStats: NewMealStats): Promise<UpdateResult> {
    const { year, month, workdays } = newMealStats;

    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ workdays })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMealBaseInfo(year: string, month: string) {
    const result = await this.mealBaseModel
      .createQueryBuilder('mealBaseEntity')
      .select(['mealBaseEntity.baseAmount AS baseAmount'])
      .where('mealBaseEntity.year = :year', { year })
      .andWhere('mealBaseEntity.month = :month', { month })
      .getRawOne();

    return result;
  }

  async createMealBase(year: string, month: string, baseAmount: number): Promise<InsertResult> {
    return await this.mealBaseModel
      .createQueryBuilder()
      .insert()
      .into(MealBaseEntity)
      .values({ year, month, baseAmount })
      .execute();
  }

  async updateMealBase(year: string, month: string, baseAmount: number): Promise<UpdateResult> {
    return await this.mealBaseModel
      .createQueryBuilder()
      .update(MealBaseEntity)
      .set({ baseAmount })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getAdminMealBudget({ perPage, pageNo }: PageNoDto, filterInfo: AdminMealBudgetFilterDto) {
    const { year, month } = filterInfo;
    const query: SelectQueryBuilder<MealStatsEntity> = this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.mealStatsIdx AS mealStatsIdx',
        'mealStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.note AS note',
        'mealStatsEntity.year AS year',
        'mealStatsEntity.month AS month',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .andWhere('userEntity.userAvail IS NULL');

    const total = await query.getCount();
    const totalPage = Math.ceil(total / perPage);

    query
      .orderBy('userEntity.gradeIdx', 'ASC')
      .addOrderBy('userEntity.userName', 'ASC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    return { totalPage, total, mealBudget: result };
  }

  async updateMealStatsNote(mealStatsIdx: number, { note }: UpdateNoteDto): Promise<UpdateResult> {
    return await this.mealStatsModel
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

  async getUserMealStats(year: string, month: string) {
    const results = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select([
        'mealStatsEntity.mealStatsIdx AS mealStatsIdx',
        'mealStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'teamEntity.teamName AS teamName',
        'mealStatsEntity.mealBudget AS mealBudget',
        'mealStatsEntity.mealExpense AS mealExpense',
        '(mealStatsEntity.mealBudget - mealStatsEntity.mealExpense) AS mealBalance',
        'CASE WHEN (mealStatsEntity.mealBudget - mealStatsEntity.mealExpense) < 0 THEN (mealStatsEntity.mealBudget - mealStatsEntity.mealExpense) ELSE 0 END AS mealOverpay',
        'mealStatsEntity.totalOverpay AS totalOverpay',
        'mealStatsEntity.breakfastExpense AS breakfastExpense',
        'mealStatsEntity.dinnerExpense AS dinnerExpense',
        'mealStatsEntity.breakfastOverpay AS breakfastOverpay',
        'mealStatsEntity.dinnerOverpay AS dinnerOverpay',
        'mealStatsEntity.workdays AS workdays',
        'mealStatsEntity.holidays AS holidays',
        'mealStatsEntity.timeoffDays AS timeoffDays',
        'mealStatsEntity.holidayWorkdays AS holidayWorkdays',
        'mealStatsEntity.note AS note',
        'mealStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = mealStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .andWhere('userEntity.userAvail IS NULL')
      .orderBy('userEntity.gradeIdx', 'ASC')
      .getRawMany();

    const transformedResult = results.map((result) => ({
      ...result,
      mealOverpay: Number(result.mealOverpay),
      mealBalance: Number(result.mealBalance),
    }));

    return transformedResult;
  }

  async updateClearStatusComplete(mealStatsIdx: number): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ clearStatus: ClearStatusEnum.COMPLETE })
      .where('mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .execute();
  }

  async updateClearStatusNotYet(mealStatsIdx: number): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ clearStatus: ClearStatusEnum.NOT_YET })
      .where('mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .execute();
  }

  async getMyBreakfastOverpay(year: string, month: string, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['COALESCE(SUM(mealEntity.amount), 0) AS total', 'COUNT(*) as cnt']) // null일 경우 0으로
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.mealType = :mealType', { mealType: MealTypeEnum.BREAKFAST })
      .andWhere('mealEntity.amount > :baseAmount', { baseAmount: DEFAULT_BREAKFAST_RATE })
      .getRawOne();

    return result;
  }

  async updateMyBreakfastOverpayInStats(
    breakfastOverpay: number,
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ breakfastOverpay })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMyDinnerOverpay(year: string, month: string, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select(['COALESCE(SUM(mealEntity.amount), 0) AS total', 'COUNT(*) as cnt']) // null일 경우 0으로
      .where('mealEntity.userIdx = :userIdx', { userIdx })
      .andWhere('mealEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('mealEntity.mealType = :mealType', { mealType: MealTypeEnum.DINNER })
      .andWhere('mealEntity.amount > :baseAmount', { baseAmount: DEFAULT_DINNER_RATE })
      .getRawOne();

    return result;
  }

  async updateMyDinnerOverpayInStats(
    dinnerOverpay: number,
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ dinnerOverpay })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getMealStatsInfoByIdx(mealStatsIdx: number) {
    const result = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select(['mealStatsEntity.userIdx AS userIdx', 'mealStatsEntity.year AS year', 'mealStatsEntity.month AS month'])
      .where('mealStatsEntity.mealStatsIdx = :mealStatsIdx', { mealStatsIdx })
      .getRawOne();

    return result;
  }

  async getMealDetail(year: string, month: string, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result = await this.mealModel
      .createQueryBuilder('mealEntity')
      .select([
        'mealEntity.targetDay AS targetDay',
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
