import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { DeleteResult, EntityManager, InsertResult, Repository, UpdateResult } from 'typeorm';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';
import { WelfareInfoDto, WelfareStatsDto } from '../dto/welfare.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { HalfYearEnum, YNEnum } from '../../../common/constant/enum';

@Injectable()
export class WelfareRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(WelfareEntity) private readonly welfareModel: Repository<WelfareEntity>,
    @InjectRepository(WelfareStatsEntity)
    private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
  ) {}

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getCount();

    return userCnt;
  }

  async getAllUserNames(): Promise<string[]> {
    const result: { userName: string }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .getRawMany();

    const allNames: string[] = result.map((r) => r.userName);

    return allNames;
  }

  async createWelfare(
    userIdx: number,
    { targetDay, amount, content, payerName }: CreateWelfareDto,
    manager: EntityManager,
  ): Promise<number> {
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(WelfareEntity)
      .values({ userIdx, targetDay, amount, content, payerName })
      .execute();

    const welfareIdx: number = result.identifiers[0].welfareIdx;

    return welfareIdx;
  }

  async createPayeer(
    welfareIdx: number,
    payeerIdx: number,
    { targetDay, content, payerName }: CreateWelfareDto | UpdateWelfareDto,
    manager: EntityManager,
  ): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(WelfareEntity)
      .values({
        userIdx: payeerIdx,
        payerWelfareIdx: welfareIdx,
        amount: null,
        selfWrittenYN: YNEnum.NO,
        targetDay,
        content,
        payerName,
      })
      .execute();
  }

  async getTotalWelfareExpense(year: number, month: number, userIdx: number, manager: EntityManager): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await manager
      .createQueryBuilder(WelfareEntity, 'welfareEntity')
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
    year: number,
    month: number,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(WelfareMonthlyStatsEntity)
      .set({ welfareMonthExpense })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getWelfareInfoByIdx(welfareIdx: number): Promise<WelfareInfoDto> {
    const result: WelfareInfoDto = await this.welfareModel
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

  async deleteWelfare(welfareIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(WelfareEntity)
      .where('welfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async updateWelfare(
    welfareIdx: number,
    { targetDay, amount, content, payerName }: UpdateWelfareDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(WelfareEntity)
      .set({ targetDay, amount, content, payerName })
      .where('welfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async updatePayeerWelfare(
    welfareIdx: number,
    { content, targetDay, payerName }: UpdateWelfareDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(WelfareEntity)
      .set({ content, targetDay, payerName })
      .where('payerWelfareIdx = :welfareIdx', { welfareIdx })
      .execute();
  }

  async getMonthWelfares(year: number, month: number, userIdx: number): Promise<WelfareEntity[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const result: WelfareEntity[] = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
        'welfareEntity.selfWrittenYN AS selfWrittenYN',
      ])
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.targetDay BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('welfareEntity.targetDay', 'DESC')
      .getRawMany();

    return result;
  }

  async getAllWelfares(userIdx: number): Promise<WelfareEntity[]> {
    const result: WelfareEntity[] = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
        'welfareEntity.selfWrittenYN AS selfWrittenYN',
      ])
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .orderBy('welfareEntity.targetDay', 'DESC')
      .getRawMany();

    return result;
  }

  async getWelfareStats(year: number, halfYear: HalfYearEnum, userIdx: number): Promise<WelfareStatsDto> {
    const result: WelfareStatsDto = await this.welfareStatsModel
      .createQueryBuilder('welfareStatsEntity')
      .select([
        'welfareStatsEntity.year AS year',
        'welfareStatsEntity.welfareBudget AS welfareBudget',
        'welfareStatsEntity.welfareExpense AS welfareExpense',
        'welfareStatsEntity.welfareBalance AS welfareBalance',
        'userEntity.userName AS userName',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = welfareStatsEntity.userIdx')
      .where('welfareStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareStatsEntity.year = :year', { year })
      .andWhere('welfareStatsEntity.halfYear = :halfYear', { halfYear })
      .getRawOne();

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

  async deleteWelfareFromIdxAndUserIdx(
    welfareIdx: number,
    userIdxs: number[],
    manager: EntityManager,
  ): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(WelfareEntity)
      .where('payerWelfareIdx = :welfareIdx', { welfareIdx })
      .andWhere('userIdx IN (:...userIdxs)', { userIdxs })
      .execute();
  }
}
