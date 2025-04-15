import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import {
  getStartAndEndDateByHalfYear,
  getStartAndEndDateByMonth,
  removeAllWhiteSpace,
} from '../../../common/utils/utility';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { ClearStatusEnum, ConfirmEnum, UserGradeIdxEnum, HalfYearEnum, YNEnum } from '../../../common/constant/enum';
import { CreateWelfareBudgetDto } from '../dto/createBudget.dto';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { AdminWelfareFilterDto } from '../dto/query.dto';
import { TeamEntity } from '../../../entity/user/team.entity';
import { NewWelfareMonthStats, NewWelfareStats } from '../interface';

@Injectable()
export class WelfareRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(WelfareEntity) private readonly welfareModel: Repository<WelfareEntity>,
    @InjectRepository(WelfareMonthlyStatsEntity)
    private readonly welfareMonthStatsModel: Repository<WelfareMonthlyStatsEntity>,
    @InjectRepository(WelfareStatsEntity)
    private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
  ) {}

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getUserNameByIdx(userIdx: number): Promise<{ userName: string }> {
    const result: { userName: string } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getRawOne();

    return result;
  }

  async getAllUserNames(): Promise<string[]> {
    const result: { userName: string }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .andWhere('userEntity.userAvail IS NULL')
      .getRawMany();

    const allNames: string[] = result.map((r) => r.userName);

    return allNames;
  }

  async createWelfare(userIdx: number, { targetDay, amount, content, payerName }: CreateWelfareDto): Promise<number> {
    const result: InsertResult = await this.welfareModel
      .createQueryBuilder()
      .insert()
      .into(WelfareEntity)
      .values({ userIdx, targetDay, amount, content, payerName })
      .execute();

    const welfareIdx: number = result.identifiers[0].welfareIdx;

    return welfareIdx;
  }

  async createPayee(
    welfareIdx: number,
    payeeIdx: number,
    { targetDay, content, payerName }: CreateWelfareDto | UpdateWelfareDto,
  ): Promise<InsertResult> {
    return await this.welfareModel
      .createQueryBuilder()
      .insert()
      .into(WelfareEntity)
      .values({
        userIdx: payeeIdx,
        payerWelfareIdx: welfareIdx,
        amount: null,
        selfWrittenYN: YNEnum.NO,
        targetDay,
        content,
        payerName,
      })
      .execute();
  }

  async getTotalWelfareExpense(year: string, month: string, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select('SUM(welfareEntity.amount)', 'total')
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.targetDay BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result.total || 0;
  }

  async updateMonthlyWelfareStats(
    welfareMonthExpense: number,
    year: string,
    month: string,
    userIdx: number,
  ): Promise<UpdateResult> {
    return await this.welfareMonthStatsModel
      .createQueryBuilder()
      .update(WelfareMonthlyStatsEntity)
      .set({ welfareMonthExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getWelfareInfoByIdx(welfareIdx: number) {
    const result = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
      ])
      .where('welfareEntity.welfareIdx = :welfareIdx', { welfareIdx })
      .getRawOne();

    return result;
  }

  async deleteWelfare(welfareIdx: number): Promise<DeleteResult> {
    return await this.welfareModel
      .createQueryBuilder()
      .delete()
      .from(WelfareEntity)
      .where('welfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async updateWelfare(
    welfareIdx: number,
    { targetDay, amount, content, payerName }: UpdateWelfareDto,
  ): Promise<UpdateResult> {
    return await this.welfareModel
      .createQueryBuilder()
      .update(WelfareEntity)
      .set({ targetDay, amount, content, payerName })
      .where('welfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async updatePayeeWelfare(
    welfareIdx: number,
    { content, targetDay, payerName }: UpdateWelfareDto,
  ): Promise<UpdateResult> {
    return await this.welfareModel
      .createQueryBuilder()
      .update(WelfareEntity)
      .set({ content, targetDay, payerName })
      .where('payerWelfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async getUserHalfYearWelfares(year: string, halfYear: HalfYearEnum, userIdx: number) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByHalfYear(year, halfYear);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const result = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
        'welfareEntity.selfWrittenYN AS selfWrittenYN',
        'welfareEntity.confirmYN AS confirmYN',
        'welfareEntity.payerWelfareIdx AS payerWelfareIdx',
      ])
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.targetDay BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('welfareEntity.targetDay', 'DESC')
      .addOrderBy('welfareEntity.createdAt', 'DESC')
      .getRawMany();

    // 데이터를 변환하여 payeeList를 추가
    const transformedResult = await Promise.all(
      result.map(async (welfare) => {
        const welfareIdx: number = welfare.selfWrittenYN === YNEnum.YES ? welfare.welfareIdx : welfare.payerWelfareIdx;
        const payeeList = await this.getPayeeWelfareFromPayerWelfareIdx(welfareIdx);

        return {
          welfareIdx: welfare.welfareIdx,
          userIdx: welfare.userIdx,
          targetDay: welfare.targetDay,
          content: welfare.content,
          amount: welfare.amount,
          payerName: welfare.payerName,
          selfWrittenYN: welfare.selfWrittenYN,
          confirmYN: welfare.confirmYN,
          payeeList: payeeList.length > 0 ? payeeList : [],
        };
      }),
    );

    return transformedResult;
  }

  async getWelfareStats(year: string, halfYear: HalfYearEnum, userIdx: number) {
    const defaultResult = {
      year,
      halfYear,
      welfareBudget: 0,
      welfareExpense: 0,
      welfareBalance: 0,
    };

    const statsInfo = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select([
        'welfareStatsEntity.year AS year',
        'welfareStatsEntity.halfYear AS halfYear',
        'welfareStatsEntity.welfareBudget AS welfareBudget',
        'welfareStatsEntity.welfareExpense AS welfareExpense',
        '(welfareStatsEntity.welfareBudget - welfareStatsEntity.welfareExpense) AS welfareBalance',
      ])
      .where('welfareStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareStatsEntity.year = :year', { year })
      .andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear })
      .getRawOne();

    if (!statsInfo) {
      return defaultResult;
    }

    const result = { ...statsInfo, welfareBalance: Number(statsInfo.welfareBalance) };

    return result;
  }

  async getUserIdxFromPayerWelfareIdx(welfareIdx: number): Promise<number[]> {
    const result: { userIdx: number }[] = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select(['welfareEntity.userIdx AS userIdx'])
      .where('welfareEntity.payerWelfareIdx = :welfareIdx', { welfareIdx })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async deleteWelfareFromIdxAndUserIdx(welfareIdx: number, userIdxs: number[]): Promise<DeleteResult> {
    return await this.welfareModel
      .createQueryBuilder()
      .delete()
      .from(WelfareEntity)
      .where('payerWelfareIdx = :welfareIdx', { welfareIdx })
      .andWhere('userIdx IN (:...userIdxs)', { userIdxs })
      .execute();
  }

  private async getPayeeWelfareFromPayerWelfareIdx(welfareIdx: number) {
    const result = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerWelfareIdx AS payerWelfareIdx',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareEntity.userIdx')
      .where('welfareEntity.payerWelfareIdx = :welfareIdx', { welfareIdx })
      .getRawMany();

    return result;
  }

  async getWelfareStatsCount({ period }: CreateWelfareBudgetDto, year: string): Promise<number> {
    const statsCnt: number = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .where('welfareStatsEntity.year = :year', { year })
      .andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear: period })
      .getCount();

    return statsCnt;
  }

  async getAllUserIdxExceptCEO(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userAvail IS NULL')
      .andWhere('userEntity.gradeIdx != :gradeIdx', { gradeIdx: UserGradeIdxEnum.CEO })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async createWelfareStats(newStatsInfo: NewWelfareStats): Promise<InsertResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .insert()
      .into(WelfareStatsEntity)
      .values({ ...newStatsInfo })
      .execute();
  }

  async updateWelfareStats({ welfareBudget, year, halfYear }: NewWelfareStats): Promise<UpdateResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .update(WelfareStatsEntity)
      .set({ welfareBudget })
      .where('year = :year', { year })
      .andWhere('halfYear = :halfYear', { halfYear })
      .execute();
  }

  async createWelfareMonthStats(newMonthStatsInfo: NewWelfareMonthStats): Promise<InsertResult> {
    return await this.welfareMonthStatsModel
      .createQueryBuilder()
      .insert()
      .into(WelfareMonthlyStatsEntity)
      .values({ ...newMonthStatsInfo })
      .execute();
  }

  async updateWelfareBudget(welfareStatsIdx: number, welfareBudget: number): Promise<UpdateResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .update(WelfareStatsEntity)
      .set({ welfareBudget })
      .where('welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .execute();
  }

  async getWelfareStatsCountByIdx(welfareStatsIdx: number): Promise<number> {
    const statsCnt: number = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .where('welfareStatsEntity.welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .getCount();

    return statsCnt;
  }

  async getAdminWelfareBudget(year: string, halfYear: HalfYearEnum) {
    const result = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select([
        'welfareStatsEntity.welfareStatsIdx AS welfareStatsIdx',
        'welfareStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'welfareStatsEntity.welfareBudget AS welfareBudget',
        'welfareStatsEntity.note AS note',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('welfareStatsEntity.year = :year', { year })
      .andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear })
      .orderBy('userEntity.gradeIdx', 'ASC')
      .addOrderBy('userEntity.userName', 'ASC')
      .getRawMany();

    return result;
  }

  async updateWelfareStatsNote(welfareStatsIdx: number, { note }: UpdateNoteDto): Promise<UpdateResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .update(WelfareStatsEntity)
      .set({ note })
      .where('welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .execute();
  }

  async getWelfare(pageNo: number, perPage: number, filterInfo: AdminWelfareFilterDto) {
    const query: SelectQueryBuilder<WelfareEntity> = this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'teamEntity.teamName AS teamName',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
        'welfareEntity.selfWrittenYN AS selfWrittenYN',
        'welfareEntity.payerWelfareIdx AS payerWelfareIdx',
        'welfareEntity.confirmYN AS confirmYN',
        'welfareEntity.confirmDate AS confirmDate',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('welfareEntity.targetDay BETWEEN :sDate AND :eDate', {
        sDate: filterInfo.sDate,
        eDate: filterInfo.eDate,
      });

    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('welfareEntity.targetDay', 'DESC')
      .addOrderBy('userEntity.userName', 'ASC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    // 데이터를 변환하여 payeeList를 추가
    const transformedResult = await Promise.all(
      result.map(async (welfare) => {
        const welfareIdx: number = welfare.selfWrittenYN === YNEnum.YES ? welfare.welfareIdx : welfare.payerWelfareIdx;
        const payeeList = await this.getPayeeWelfareFromPayerWelfareIdx(welfareIdx);

        return {
          welfareIdx: welfare.welfareIdx,
          userIdx: welfare.userIdx,
          userName: welfare.userName,
          teamName: welfare.teamName,
          gradeName: welfare.gradeName,
          targetDay: welfare.targetDay,
          content: welfare.content,
          amount: welfare.amount,
          payerName: welfare.payerName,
          payerWelfareIdx: welfare.payerWelfareIdx,
          confirmYN: welfare.confirmYN,
          confirmDate: welfare.confirmDate,
          payeeList: payeeList.length > 0 ? payeeList : [],
        };
      }),
    );

    return { totalPage, total, welfare: transformedResult };
  }

  async updateConfirmWelfare(welfareIdx: number, confirmYN: ConfirmEnum): Promise<UpdateResult> {
    if (confirmYN === ConfirmEnum.YES) {
      const confirmDate: Date = new Date();
      return await this.welfareModel
        .createQueryBuilder()
        .update(WelfareEntity)
        .set({ confirmYN, confirmDate })
        .where('welfareIdx = :welfareIdx', { welfareIdx })
        .execute();
    } else {
      return await this.welfareModel
        .createQueryBuilder()
        .update(WelfareEntity)
        .set({ confirmYN, confirmDate: null })
        .where('welfareIdx = :welfareIdx', { welfareIdx })
        .execute();
    }
  }

  async getUserWelfareStats(year: string, halfYear?: HalfYearEnum) {
    const query: SelectQueryBuilder<WelfareStatsEntity> = this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select([
        'welfareStatsEntity.welfareStatsIdx AS welfareStatsIdx',
        'welfareStatsEntity.year AS year',
        'welfareStatsEntity.halfYear AS halfYear',
        'welfareStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'teamEntity.teamName AS teamName',
        'welfareStatsEntity.welfareBudget AS welfareBudget',
        'welfareStatsEntity.welfareExpense AS welfareExpense',
        '(welfareStatsEntity.welfareBudget - welfareStatsEntity.welfareExpense) AS welfareBalance',
        'welfareStatsEntity.totalOverpay AS totalOverpay',
        'welfareStatsEntity.note AS note',
        'welfareStatsEntity.clearStatus AS clearStatus',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('welfareStatsEntity.year = :year', { year });

    if (halfYear) {
      query.andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear });
    }

    query.orderBy('userEntity.gradeIdx', 'ASC').addOrderBy('welfareStatsEntity.halfYear', 'ASC');

    const userStatsInfo = await query.getRawMany();
    const result = userStatsInfo.map((stats) => ({
      ...stats,
      welfareBalance: Number(stats.welfareBalance),
    }));

    return result;
  }

  async updateClearStatusComplete(welfareStatsIdx: number): Promise<UpdateResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .update(WelfareStatsEntity)
      .set({ clearStatus: ClearStatusEnum.COMPLETE })
      .where('welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .execute();
  }

  async updateClearStatusNotYet(welfareStatsIdx: number): Promise<UpdateResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .update(WelfareStatsEntity)
      .set({ clearStatus: ClearStatusEnum.NOT_YET })
      .where('welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .execute();
  }

  async getWelfareMonthStatsCnt(userIdx: number, year: string, month: string): Promise<number> {
    const refinedMonth: string = month.toString();
    const statsCnt: number = await this.welfareMonthStatsModel
      .createQueryBuilder('welfareMonthStatsEntity')
      .where('welfareMonthStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareMonthStatsEntity.year = :year', { year })
      .andWhere('welfareMonthStatsEntity.month = :month', { month: refinedMonth })
      .getCount();

    return statsCnt;
  }

  async getWelfareBudgetByIdx(welfareStatsIdx: number): Promise<number> {
    const result = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select(['welfareStatsEntity.welfareBudget AS welfareBudget'])
      .where('welfareStatsEntity.welfareStatsIdx = :welfareStatsIdx', { welfareStatsIdx })
      .getRawOne();

    return result.welfareBudget;
  }

  async updateWelfareExpense(year: string, month: string, userIdx: number): Promise<UpdateResult> {
    if (Number(month) > 7) {
      const query = `(
          SELECT COALESCE(SUM(welfare_month_expense), 0) 
          FROM welfare_monthly_stats  
          WHERE welfare_monthly_stats.user_idx = welfare_stats.user_idx 
          AND welfare_monthly_stats.year = welfare_stats.year
          AND welfare_monthly_stats.month IN ('7','8','9','10','11','12')
        )`;

      return await this.welfareStatsModel
        .createQueryBuilder()
        .update(WelfareStatsEntity)
        .set({ welfareExpense: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('halfYear = :halfYear', { halfYear: HalfYearEnum.H2 })
        .execute();
    } else {
      const query = `(
          SELECT COALESCE(SUM(welfare_month_expense), 0) 
          FROM welfare_monthly_stats  
          WHERE welfare_monthly_stats.user_idx = welfare_stats.user_idx 
          AND welfare_monthly_stats.year = welfare_stats.year
          AND welfare_monthly_stats.month IN ('1','2','3','4','5','6')
        )`;

      return await this.welfareStatsModel
        .createQueryBuilder()
        .update(WelfareStatsEntity)
        .set({ welfareExpense: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('halfYear = :halfYear', { halfYear: HalfYearEnum.H1 })
        .execute();
    }
  }
}
