import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';
import { HolidayInfo } from '../interface/holiday.interface';
import { NewMealStats } from '../interface/meal.interface';
import { NewWelfareMonthStats, NewWelfareStats } from '../interface/welfare.interface';

@Injectable()
export class SchedulerRepository {
  constructor(
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(WelfareStatsEntity) private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
  ) {}

  async insertHolidayInfo(holidayInfo: HolidayInfo): Promise<void> {
    await this.holidayModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(HolidayEntity).values(holidayInfo).execute();
    });
  }

  async getAllUserIdx(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async updateMealStats(mealStatsUpdateInfo: NewMealStats): Promise<void> {
    await this.mealStatsModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(MealStatsEntity).values(mealStatsUpdateInfo).execute();
    });
  }

  async updateWelfareStats(newWelfareStatsInfo: NewWelfareStats): Promise<void> {
    return this.welfareStatsModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(WelfareStatsEntity).values(newWelfareStatsInfo).execute();
    });
  }

  async updateWelfareMonthStats(newWelfareMonthStatsInfo: NewWelfareMonthStats): Promise<void> {
    return this.welfareStatsModel.manager.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(WelfareMonthlyStatsEntity)
        .values(newWelfareMonthStatsInfo)
        .execute();
    });
  }
}
