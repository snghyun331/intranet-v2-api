import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { HolidayInfoDto } from '../dto/holiday.dto';
import { UserEntity } from '../../../entity/user/user.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { getStartAndLastDayofMonth } from '../../../common/utils/utility';

@Injectable()
export class SchedulerRepository {
  constructor(
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
  ) {}

  async insertHolidayInfo(holidayInfo: HolidayInfoDto): Promise<void> {
    await this.holidayModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(HolidayEntity).values(holidayInfo).execute();
    });
  }

  async getAllUserIdx(): Promise<number[]> {
    const result: any[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async updateMealStats(mealStatsUpdateInfo): Promise<void> {
    await this.mealStatsModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(MealStatsEntity).values(mealStatsUpdateInfo).execute();
    });
  }

  async getPublicHolidayDate(year: number, month: number): Promise<string[]> {
    // 해당 월의 첫 번째 날과 마지막 날을 구함
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
    const firstDayOfMonthToString: string = firstDayOfMonth.format('YYYY-MM-DD');
    const lastDayOfMonthToString: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: any[] = await this.holidayModel
      .createQueryBuilder('holidayEntity')
      .select(['holidayEntity.holidayDate AS holidayDate'])
      .where('holidayEntity.holidayDate BETWEEN :firstDayOfMonthToString AND :lastDayOfMonthToString', {
        firstDayOfMonthToString,
        lastDayOfMonthToString,
      })
      .getRawMany();

    const holidayDates = result.map((r) => r.holidayDate);

    return holidayDates;
  }
}
