import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { DEFAULT_LUNCH_RATE, NUM_OF_ROWS, PAGE_NO } from '../../common/constant/constant';
import { errSeparation, getDateFormYYYYMMDD, getTotalDaysInMonth, getWeekendDates } from '../../common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfoDto } from './dto/holiday.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    public readonly configService: ConfigService,
  ) {}

  // 매년 12월 1일에 다음년도 공휴일 수집
  @Cron('0 0 1 12 *')
  async insertHolidayData(): Promise<void> {
    this.logger.log('🚀 Start Inserting Holiday Info Job !');
    const SOL_YEAR: number = new Date().getFullYear() + 1;
    const HOLIDAY_API_KEY: string = this.configService.get<string>('HOLIDAY_API_KEY');
    const HOLIDAY_API_URL: string =
      this.configService.get<string>('HOLIDAY_API_URL') +
      '?serviceKey=' +
      HOLIDAY_API_KEY +
      '&solYear=' +
      SOL_YEAR.toString() +
      '&numOfRows=' +
      NUM_OF_ROWS.toString() +
      '&pageNo=' +
      PAGE_NO.toString() +
      '&_type=json';

    try {
      const axiosResponse: AxiosResponse = await this.httpService.axiosRef.get(HOLIDAY_API_URL);
      const axiosHolidayList: AxiosHoliday[] = axiosResponse.data.response?.body?.items?.item;

      if (!axiosHolidayList || axiosHolidayList.length === 0) {
        throw new BadRequestException('공휴일 정보 수집에 실패했습니다.');
      }

      await Promise.all(
        axiosHolidayList.map(async (axiosHoliday) => {
          const holidayDate: string = getDateFormYYYYMMDD(axiosHoliday.locdate.toString());
          const holidayInfo: HolidayInfoDto = { holidayName: axiosHoliday.dateName, holidayDate };
          await this.schedulerRepository.insertHolidayInfo(holidayInfo);
        }),
      );
      this.logger.log('🏁 Inserting Holiday Info Job Completed !');
    } catch (err) {
      const statusCode = err.response.status;
      const errMsg = err.response.data;

      errSeparation(statusCode, errMsg);
    }
  }

  @Cron('0 0 25 * *')
  async updateMealStats(): Promise<void> {
    this.logger.log('🚀 Start Updating Meal Stats Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();

    const weekendDates: string[] = getWeekendDates(year, nextMonth);
    const publicHolidayDates: string[] = await this.schedulerRepository.getPublicHolidayDate(year, nextMonth);
    const holidayDates: Set<string> = new Set<string>([...weekendDates, ...publicHolidayDates]);
    const holidays: number = holidayDates.size;
    const totalDays: number = getTotalDaysInMonth(year, nextMonth); // 다음딜 총 일수
    const workdays: number = totalDays - holidays;
    const mealBudget: number = DEFAULT_LUNCH_RATE * workdays;
    const userIdxList: number[] = await this.schedulerRepository.getAllUserIdx();

    await Promise.all(
      userIdxList.map(async (userIdx) => {
        const mealStatsUpdateInfo = {
          userIdx,
          year: year.toString(),
          month: nextMonth.toString(),
          workdays,
          holidays,
          mealBudget,
        };
        await this.schedulerRepository.updateMealStats(mealStatsUpdateInfo);
      }),
    );

    this.logger.log('🏁 Updating Meal Stats Job Completed !');
  }
}
