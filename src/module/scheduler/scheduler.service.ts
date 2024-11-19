import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { NUM_OF_ROWS, PAGE_NO } from '../../common/constant/constant';
import { getDateFormYYYYMMDD, getWeekendDates } from '../../common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfo } from './interface/holiday.interface';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    public readonly configService: ConfigService,
  ) {}

  // 다음 분기 휴일 정보 수집 및 저장
  @Cron('0 0 25 6,12 *')
  async insertHoliday() {
    this.logger.log('🚀 Start Inserting Holiday Info Job !');
    const date: Date = new Date();
    const nowMonth: number = date.getMonth() + 1;
    let nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? date.getFullYear() + 1 : date.getFullYear();
    for (let i = 0; i < 6; i++) {
      const publicHolidayInfoList: HolidayInfo[] = (await this.getPublicHolidayDatas(year, nextMonth)) ?? [];
      const weekendInfoList: HolidayInfo[] = await this.getWeekendDatas(year, nextMonth);
      // Set을 이용하여 holidayDate 기준으로 중복 제거
      const mergedHolidaySet = new Set<string>();
      // 중복 제거를 위한 결과 배열 생성
      const mergedHolidayInfoList: HolidayInfo[] = [];
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
      nextMonth++;
    }

    this.logger.log('🏁 Inserting Holiday Info Job Completed !');
  }

  private async getPublicHolidayDatas(year: number, month: number): Promise<HolidayInfo[]> {
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
      const axiosHolidayList: AxiosHoliday[] | AxiosHoliday = axiosResponse.data.response?.body?.items?.item;
      if (!axiosHolidayList) return;

      let holiday: HolidayInfo[] = [];
      if (Array.isArray(axiosHolidayList)) {
        holiday = axiosHolidayList.map((axiosHoliday) => {
          const holidayDate: string = getDateFormYYYYMMDD(axiosHoliday.locdate.toString());
          const holidayInfo: HolidayInfo = { holidayName: axiosHoliday.dateName, holidayDate };
          return holidayInfo;
        });
      } else {
        const holidayDate: string = getDateFormYYYYMMDD(axiosHolidayList.locdate.toString());
        holiday = [{ holidayName: axiosHolidayList.dateName, holidayDate }];
      }

      return holiday;
    } catch (err) {
      this.logger.error(err);
    }
  }

  private async getWeekendDatas(year: number, month: number): Promise<HolidayInfo[]> {
    const weekendDates: string[] = getWeekendDates(year, month);
    const weekendInfoList: HolidayInfo[] = await Promise.all(
      weekendDates.map(async (weekendDate) => {
        const weekendInfo: HolidayInfo = { holidayName: '주말', holidayDate: weekendDate };
        return weekendInfo;
      }),
    );

    return weekendInfoList;
  }
}
