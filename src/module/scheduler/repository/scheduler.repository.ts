import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { HolidayInfoDto } from '../dto/holiday.dto';
import { UserEntity } from '../../../entity/user/user.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';

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

    const userIdxList = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async updateMealStats(mealStatsUpdateInfo): Promise<void> {
    await this.mealStatsModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(MealStatsEntity).values(mealStatsUpdateInfo).execute();
    });
  }

  async getPublicHolidayDate(year: number, month: number): Promise<string[]> {
    // 해당 월의 첫 번째 날과 마지막 날을 구함
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날 계산
    const endDateString = `${year}-${String(month).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;

    const result: any[] = await this.holidayModel
      .createQueryBuilder('holidayEntity')
      .select(['holidayEntity.holidayDate AS holidayDate'])
      .where('holidayEntity.holidayDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate: endDateString,
      })
      .getRawMany();

    const holidayDates = result.map((r) => r.holidayDate);

    return holidayDates;
  }
}
