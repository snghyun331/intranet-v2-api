import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { Repository } from 'typeorm';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';
import { WelfareInfoDto } from '../dto/welfare.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';

@Injectable()
export class WelfareRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(WelfareEntity) private readonly welfareModel: Repository<WelfareEntity>,
    @InjectRepository(WelfareMonthlyStatsEntity)
    private readonly welfareMonthStatsModel: Repository<WelfareMonthlyStatsEntity>,
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

  async createWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto): Promise<void> {
    return this.welfareModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(WelfareEntity)
        .values({ userIdx, ...newWelfareInfo })
        .execute();
    });
  }

  async getTotalWelfareExpense(year: number, month: number, userIdx: number): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: { total: number } = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select('SUM(welfareEntity.pay_amount)', 'total')
      .where('welfareEntity.userIdx = :userIdx', { userIdx })
      .andWhere('welfareEntity.useDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawOne();

    return result.total;
  }

  async updateMonthlyWelfareStats(welfareMonthExpense: number, year: number, month: number, userIdx: number) {
    return this.welfareMonthStatsModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(WelfareMonthlyStatsEntity)
        .set({ welfareMonthExpense })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .andWhere('month = :month', { month })
        .execute();
    });
  }

  async getWelfareInfoByIdx(welfareIdx: number): Promise<WelfareInfoDto> {
    const result: WelfareInfoDto = await this.welfareModel
      .createQueryBuilder('welfareEntity')
      .select([
        'welfareEntity.welfareIdx AS welfareIdx',
        'welfareEntity.userIdx AS userIdx',
        'welfareEntity.useDate AS useDate',
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
}
