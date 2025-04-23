import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { NUM_OF_ROWS, PAGE_NO } from '../../common/constant/constant';
import {
  getDateFormYYYYMMDD,
  getDaysBetwweenTwoDates,
  getTodayLeaveGrantType,
  getWeekendDates,
  getYearsSinceJoin,
} from '../../common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfo } from './interface/holiday.interface';
import { Transactional } from 'typeorm-transactional';
import * as moment from 'moment';
import { LeaveGrantTypeEnum } from '../../common/constant/enum';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    public readonly configService: ConfigService,
  ) {}

  /* 다음 분기 휴일 정보 수집 및 저장 */
  @Cron('0 0 25 6,12 *')
  @Transactional()
  async insertHoliday() {
    this.logger.log('🚀 다음 분기 휴일 정보 수집을 시작합니다 !');
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
      for (const holidayInfo of mergedHolidayInfoList) {
        await this.schedulerRepository.insertHolidayInfo(holidayInfo);
      }

      nextMonth++;
    }

    this.logger.log('🏁 다음 분기 휴일 정보 수집을 마칩니다 !');
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

  /* 매일 자정마다 당일 전직원 근태 내역 저장 */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_1AM)
  @Transactional()
  async insertAllCommutesForToday() {
    this.logger.log(`🚀 오늘의 출근 정보 자동 등록을 시작합니다. (현재시간: ${new Date()}) !`);

    await this.schedulerRepository.insertCommutesForToday();

    this.logger.log('🏁 오늘의 출근 정보 자동 등록을 마칩니다. !');
  }

  /* 매년 1월 1일에 해당년도 연차 현황 일괄 등록 */
  @Cron(CronExpression.EVERY_YEAR)
  @Transactional()
  async insertReceivedAnnualLeave() {
    this.logger.log(`🚀 연차 자동 등록을 시작합니다. (현재시간: ${new Date()}) !`);
    const currentYear: string = moment().utcOffset(9).year().toString();
    const users = await this.schedulerRepository.getAllUsersInfo();
    for (const user of users) {
      console.log(user);
      let totalReceivedAnnualLeave: number = 0;

      // 근속년수 계산
      const { userIdx, joinDate } = user;
      const yearsSinceJoin = getYearsSinceJoin(joinDate);

      // 사용가능 연차 계산
      if (yearsSinceJoin < 1) {
        const lastYear: string = (Number(currentYear) - 1).toString();
        const { lastYearAnnualLeaveBalance } = await this.schedulerRepository.getUserLeaveStatsInfo(userIdx, lastYear);
        totalReceivedAnnualLeave = lastYearAnnualLeaveBalance;
      } else {
        const extraAnnualLeave: number = Math.floor((yearsSinceJoin - 1) / 2); // 3년차부터 2년마다 1씩 증가
        totalReceivedAnnualLeave = 15 + extraAnnualLeave;
      }

      // leaveStats 엔티티에 정보(totalReceived) 추가
      await this.schedulerRepository.insertLeaveStatsInfo(userIdx, currentYear, totalReceivedAnnualLeave);

      // leaveUsage 엔티티에 정보(default: 0) 추가
      await this.schedulerRepository.insertLeaveUsageInfo(userIdx, currentYear);

      // leaveMonthlyUsage 엔티티에 정보(default: 0) 추가
      await this.schedulerRepository.insertLeaveMonthlyUsageInfo(userIdx, currentYear);
    }

    this.logger.log('🏁 연차 자동 등록을 마칩니다. !');
  }

  /*
   * 입사 1년 미만 직원: 매달 월차 1일 자동 부여
   * 입사 1년 경과 직원: (전년도 재직일수/365) * 15 계산 -> 올림하여 연차 부여
   * 기준일은 today(오늘)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Transactional()
  async insertExtraReceivedAnnualLeaveForMidJoiner() {
    const currentYear: number = moment().utcOffset(9).year();
    const users = await this.schedulerRepository.getAllUserWithLessThanOneYear();
    for (const user of users) {
      const { userIdx, userName, joinDate } = user;
      this.logger.log(`🚀 중도입사자 ${userName}에 대한 연차 부여를 시작합니다. (현재시간: ${new Date()}) !`);

      const leaveGrantType: LeaveGrantTypeEnum = getTodayLeaveGrantType(joinDate);

      // 입사 1년 경과인 직원일 경우
      if (leaveGrantType === LeaveGrantTypeEnum.ANNUAL) {
        const endDayofLastYear: string = `${currentYear - 1}-12-31`; // 전년도 마지막 날
        const lastYearWorkDays: number = getDaysBetwweenTwoDates(joinDate, endDayofLastYear); // 재직일 수
        const extraAnnualLeaves: number = Math.ceil((lastYearWorkDays / 365) * 15); // 중도입사 연차 부여
        const currentYearString: string = currentYear.toString();
        await this.schedulerRepository.insertExtraReceivedAnnualLeave(
          userIdx,
          currentYearString,
          extraAnnualLeaves,
          leaveGrantType,
        );
      }

      // 입사 1년 미만인 직원일 경우
      if (leaveGrantType === LeaveGrantTypeEnum.MONTHLY) {
        const extraAnnualLeaves: number = 1; // 월차 부여
        const currentYearString: string = currentYear.toString();
        await this.schedulerRepository.insertExtraReceivedAnnualLeave(
          userIdx,
          currentYearString,
          extraAnnualLeaves,
          leaveGrantType,
        );
      }
    }
  }
}
