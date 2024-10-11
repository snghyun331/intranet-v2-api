import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { DEFAULT_LUNCH_RATE, DEFAULT_TOTAL_WELFARE, NUM_OF_ROWS, PAGE_NO } from '../../common/constant/constant';
import { errSeparation, getDateFormYYYYMMDD, getTotalDaysInMonth, getWeekendDates } from '../../common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfoDto } from './dto/holiday.dto';
import { NewMealStatsDto } from './dto/meal.dto';
import { HalfYearEnum } from '../../common/constant/enum';
import { NewWelfareMonthStatsDto, NewWelfareStatsDto } from './dto/welfare.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    public readonly configService: ConfigService,
  ) {}

  // 매달 25일에 오전 6시에 다음달 식대 사용가능 금액 업데이트
  @Cron('0 6 25 * *')
  async updateMealStats(): Promise<void> {
    this.logger.log('🚀 Start Updating Meal Stats Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();
    const holidayDates: string[] = await this.schedulerRepository.getHolidayDates(year, nextMonth);
    const holidays: number = holidayDates.length;
    const totalDays: number = getTotalDaysInMonth(year, nextMonth); // 다음달 총 일수
    const workdays: number = totalDays - holidays;
    const mealBudget: number = DEFAULT_LUNCH_RATE * workdays;
    const userIdxList: number[] = await this.schedulerRepository.getAllUserIdx();

    await Promise.all(
      userIdxList.map(async (userIdx) => {
        const newMealStatsInfo: NewMealStatsDto = {
          userIdx,
          year: year.toString(),
          month: nextMonth.toString(),
          workdays,
          holidays,
          mealBudget,
          mealBalance: 0,
        };
        await this.schedulerRepository.updateMealStats(newMealStatsInfo);
      }),
    );

    this.logger.log('🏁 Updating Meal Stats Job Completed !');
  }

  // 매달 25일 오전 0시에 다음달 휴일 정보 수집 및 저장
  @Cron('0 0 25 * *')
  async insertHolday2() {
    this.logger.log('🚀 Start Inserting Holiday Info Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();
    const publicHolidayInfoList: HolidayInfoDto[] = (await this.getPublicHolidayDatas(year, nextMonth)) ?? [];
    const weekendInfoList: HolidayInfoDto[] = await this.getWeekendDatas(year, nextMonth);
    // Set을 이용하여 holidayDate 기준으로 중복 제거
    const mergedHolidaySet = new Set<string>();
    // 중복 제거를 위한 결과 배열 생성
    const mergedHolidayInfoList: HolidayInfoDto[] = [];
    // 공휴일 정보 추가
    publicHolidayInfoList.forEach((holiday) => {
      if (!mergedHolidaySet.has(holiday.holidayDate)) {
        mergedHolidaySet.add(holiday.holidayDate);
        mergedHolidayInfoList.push(holiday);
      }
    });
    // 주말 정보 추가
    weekendInfoList.forEach((weekend) => {
      if (!mergedHolidaySet.has(weekend.holidayDate)) {
        mergedHolidaySet.add(weekend.holidayDate);
        mergedHolidayInfoList.push(weekend);
      }
    });
    await Promise.all(
      mergedHolidayInfoList.map(async (holidayInfo) => {
        await this.schedulerRepository.insertHolidayInfo(holidayInfo);
      }),
    );
    this.logger.log('🏁 Inserting Holiday Info Job Completed !');
  }

  private async getPublicHolidayDatas(year: number, month: number): Promise<HolidayInfoDto[]> {
    const SOL_YEAR: string = year.toString();
    let SOL_MONTH: string;
    if (month < 10) {
      SOL_MONTH = `0${month}`;
    } else {
      SOL_MONTH = month.toString();
    }
    const HOLIDAY_API_KEY: string = this.configService.get<string>('HOLIDAY_API_KEY');
    const HOLIDAY_API_URL: string =
      this.configService.get<string>('HOLIDAY_API_URL') +
      '?serviceKey=' +
      HOLIDAY_API_KEY +
      '&solYear=' +
      SOL_YEAR +
      '&solMonth=' +
      SOL_MONTH +
      '&numOfRows=' +
      NUM_OF_ROWS.toString() +
      '&pageNo=' +
      PAGE_NO.toString() +
      '&_type=json';

    try {
      const axiosResponse: AxiosResponse = await this.httpService.axiosRef.get(HOLIDAY_API_URL);
      const axiosHolidayList: AxiosHoliday[] = axiosResponse.data.response?.body?.items?.item;
      if (!axiosHolidayList || axiosHolidayList.length === 0) return;

      const holidayInfoList: HolidayInfoDto[] = axiosHolidayList.map((axiosHoliday) => {
        const holidayDate: string = getDateFormYYYYMMDD(axiosHoliday.locdate.toString());
        const holidayInfo: HolidayInfoDto = { holidayName: axiosHoliday.dateName, holidayDate };
        return holidayInfo;
      });

      return holidayInfoList;
    } catch (err) {
      const statusCode = err.response.status;
      const errMsg = err.response.data;

      errSeparation(statusCode, errMsg);
    }
  }

  private async getWeekendDatas(year: number, month: number): Promise<HolidayInfoDto[]> {
    const weekendDates: string[] = getWeekendDates(year, month);
    const weekendInfoList: HolidayInfoDto[] = await Promise.all(
      weekendDates.map(async (weekendDate) => {
        const weekendInfo: HolidayInfoDto = { holidayName: '주말', holidayDate: weekendDate };
        return weekendInfo;
      }),
    );

    return weekendInfoList;
  }

  @Cron('0 0 25 6,12 *')
  async updateWelfareStats(): Promise<void> {
    this.logger.log('🚀 Start Updating Welfare Stats Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();
    const halfYear: HalfYearEnum = nextMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;

    const userIdxList: number[] = await this.schedulerRepository.getAllUserIdx();

    await Promise.all(
      userIdxList.map(async (userIdx) => {
        const newWelfareStatsInfo: NewWelfareStatsDto = {
          userIdx,
          year: year.toString(),
          halfYear,
          welfareBudget: DEFAULT_TOTAL_WELFARE,
        };
        await this.schedulerRepository.updateWelfareStats(newWelfareStatsInfo);
      }),
    );

    this.logger.log('🏁 Updating Welfare Stats Job Completed !');
  }

  @Cron('0 0 25 * *')
  async updateWelfareMonthStats(): Promise<void> {
    this.logger.log('🚀 Start Updating Welfare Month Stats Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    const nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();

    const userIdxList: number[] = await this.schedulerRepository.getAllUserIdx();

    await Promise.all(
      userIdxList.map(async (userIdx) => {
        const newWelfareMonthStatsInfo: NewWelfareMonthStatsDto = {
          userIdx,
          year: year.toString(),
          month: nextMonth.toString(),
          welfareMonthExpense: 0,
        };
        await this.schedulerRepository.updateWelfareMonthStats(newWelfareMonthStatsInfo);
      }),
    );

    this.logger.log('🏁 Updating Welfare Month Stats Job Completed !');
  }
}
