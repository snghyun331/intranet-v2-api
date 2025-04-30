import { Injectable } from '@nestjs/common';
import { getStartAndEndDateByMonth } from '../../../common/utils/utility';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class GlobalHolidayRepository {
  constructor(@InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>) {}

  async getHolidayDates(year: string, month: string): Promise<string[]> {
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
}
