import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { EntityManager, InsertResult, Repository, UpdateResult } from 'typeorm';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';
import { WelfareInfoDto, WelfareStatsDto } from '../dto/welfare.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';
import { WelfarePayeeEntity } from '../../../entity/welfare/payee.entity';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { HalfYearEnum, YNEnum } from '../../../common/constant/enum';
import { Welfares } from '../interface/welfare.interface';

@Injectable()
export class WelfareRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(WelfareEntity) private readonly welfareModel: Repository<WelfareEntity>,
    @InjectRepository(WelfareMonthlyStatsEntity)
    private readonly welfareMonthStatsModel: Repository<WelfareMonthlyStatsEntity>,
    @InjectRepository(WelfareStatsEntity)
    private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
    @InjectRepository(WelfarePayeeEntity) private readonly payeeModel: Repository<WelfarePayeeEntity>,
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

    return result.total;
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

  async deleteWelfare(welfareIdx: number): Promise<void> {
    return this.welfareModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .delete()
        .from(WelfareEntity)
        .where('welfareIdx = :welfareIdx', { welfareIdx })
        .execute();
    });
  }

  async updateWelfare(welfareIdx: number, updateWelfareInfo: UpdateWelfareDto): Promise<void> {
    return this.welfareModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(WelfareEntity)
        .set(updateWelfareInfo)
        .where('welfareIdx = :welfareIdx', { welfareIdx })
        .execute();
    });
  }

  async createPayeer(welfareIdx: number, payeerIdx: number, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(WelfarePayeeEntity)
      .values({ userIdx: payeerIdx, welfareIdx })
      .execute();
  }

  // async getMonthWelfares(year: number, month: number, userIdx: number): Promise<WelfareEntity[]> {
  //   const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
  //   const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
  //   const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

  //   const query = `
  //   (SELECT
  //       welfareEntity.welfare_idx AS welfareIdx,
  //       welfareEntity.user_idx AS userIdx,
  //       welfareEntity.target_day AS targetDay,
  //       welfareEntity.content AS content,
  //       welfareEntity.amount AS amount,
  //       welfareEntity.payer_name AS payerName
  //    FROM welfare welfareEntity
  //    WHERE welfareEntity.user_idx = '${userIdx}'
  //    AND welfareEntity.target_day BETWEEN '${startDate}' AND '${endDate}')
  //   UNION ALL
  //   (SELECT
  //       payeeEntity.welfare_idx AS welfareIdx,
  //       payeeEntity.user_idx AS userIdx,
  //       welfareEntity.target_day AS targetDay,
  //       welfareEntity.content AS content,
  //       payeeEntity.amount AS amount,
  //       welfareEntity.payer_name AS payerName
  //    FROM welfare_payee payeeEntity
  //    INNER JOIN welfare welfareEntity
  //      ON welfareEntity.welfare_idx = payeeEntity.welfare_idx
  //    WHERE payeeEntity.user_idx = '${userIdx}'
  //    AND welfareEntity.target_day BETWEEN '${startDate}' AND '${endDate}')
  //   ORDER BY targetDay DESC
  // `;

  //   const result: WelfareEntity[] = await this.welfareModel.query(query);

  //   return result;
  // }
  async getMonthWelfares(year: number, month: number, userIdx: number): Promise<Welfares[]> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const result1: WelfareEntity[] = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
      ])
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.targetDay BETWEEN :startDate AND :endDate', { startDate, endDate })
      .orderBy('welfareEntity.targetDay', 'DESC')
      .getRawMany();

    const result2: WelfareEntity[] = await this.payeeModel
      .createQueryBuilder('payeeEntity')
      .select([
        'payeeEntity.welfareIdx AS welfareIdx',
        'payeeEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'payeeEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
      ])
      .innerJoin(WelfareEntity, 'welfareEntity', 'welfareEntity.welfareIdx = payeeEntity.welfareIdx')
      .where('payeeEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.targetDay BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawMany();

    const finalResult: Welfares[] = [
      ...result1.map((item) => ({ ...item, selfWrittenYN: YNEnum.YES })),
      ...result2.map((item) => ({ ...item, selfWrittenYN: YNEnum.NO })),
    ];

    finalResult.sort((a, b) => new Date(b.targetDay).getTime() - new Date(a.targetDay).getTime());

    return finalResult;
  }

  // async getAllWelfares(userIdx: number): Promise<WelfareEntity[]> {
  //   const query = `
  //   (SELECT
  //       welfareEntity.welfare_idx AS welfareIdx,
  //       welfareEntity.user_idx AS userIdx,
  //       welfareEntity.target_day AS targetDay,
  //       welfareEntity.content AS content,
  //       welfareEntity.amount AS amount,
  //       welfareEntity.payer_name AS payerName
  //    FROM welfare welfareEntity
  //    WHERE welfareEntity.user_idx = '${userIdx}')
  //   UNION ALL
  //   (SELECT
  //       payeeEntity.welfare_idx AS welfareIdx,
  //       payeeEntity.user_idx AS userIdx,
  //       welfareEntity.target_day AS targetDay,
  //       welfareEntity.content AS content,
  //       payeeEntity.amount AS amount,
  //       welfareEntity.payer_name AS payerName
  //    FROM welfare_payee payeeEntity
  //    INNER JOIN welfare welfareEntity
  //      ON welfareEntity.welfare_idx = payeeEntity.welfare_idx
  //    WHERE payeeEntity.user_idx = '${userIdx}')
  //   ORDER BY targetDay DESC
  // `;

  //   const result: WelfareEntity[] = await this.welfareModel.query(query);

  //   return result;
  // }
  async getAllWelfares(userIdx: number): Promise<Welfares[]> {
    const result1: WelfareEntity[] = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'welfareEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
      ])
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .orderBy('welfareEntity.targetDay', 'DESC')
      .getRawMany();

    const result2: WelfareEntity[] = await this.payeeModel
      .createQueryBuilder('payeeEntity')
      .select([
        'payeeEntity.welfareIdx AS welfareIdx',
        'payeeEntity.userIdx AS userIdx',
        'welfareEntity.targetDay AS targetDay',
        'welfareEntity.content AS content',
        'payeeEntity.amount AS amount',
        'welfareEntity.payerName AS payerName',
      ])
      .innerJoin(WelfareEntity, 'welfareEntity', 'welfareEntity.welfareIdx = payeeEntity.welfareIdx')
      .where('payeeEntity.userIdx = :userIdx', { userIdx })
      .getRawMany();

    const finalResult: Welfares[] = [
      ...result1.map((item) => ({ ...item, selfWrittenYN: YNEnum.YES })),
      ...result2.map((item) => ({ ...item, selfWrittenYN: YNEnum.NO })),
    ];

    finalResult.sort((a, b) => new Date(b.targetDay).getTime() - new Date(a.targetDay).getTime());

    return finalResult;
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
}
