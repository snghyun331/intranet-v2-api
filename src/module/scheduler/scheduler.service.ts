import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { NUM_OF_ROWS, PAGE_NO } from '@common/constant/constant';
import {
  calculateExtraAnnualLeave,
  getDateFormYYYYMMDD,
  getDaysBetwweenTwoDates,
  getTodayLeaveGrantType,
  getWeekendDates,
  getYearsSinceJoin,
} from '@common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfo } from './interface/holiday.interface';
import { Transactional } from 'typeorm-transactional';
import * as moment from 'moment';
import { LeaveGrantTypeEnum } from '@common/constant/enum';
import { NewLeaveStats } from './interface/leaveStats.interface';
import { GlobalHolidayRepository } from '../global/repository/globalHoliday.repository';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    private readonly holidayRepository: GlobalHolidayRepository,
    public readonly configService: ConfigService,
  ) {}

  /* 다음 분기 휴일 정보 수집 및 저장 */
  @Cron('30 0 25 6,12 *')
  @Transactional()
  async insertHoliday() {
    this.logger.log('🚀 다음 분기 휴일 정보 수집을 시작합니다 !');
    const today = moment().utcOffset(9);
    const nowMonth: number = today.month() + 1;
    let nextMonth: number = nowMonth === 12 ? 1 : nowMonth + 1;
    const year: number = nowMonth === 12 ? today.year() + 1 : today.year();
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

  /* 매일 자정마다 당일 전직원 근태 내역 생성 */
  @Cron(CronExpression.MONDAY_TO_FRIDAY_AT_2AM)
  @Transactional()
  async insertAllCommutesForToday() {
    /* 공휴일, 휴일에는 생성 제외 */
    const today = moment().utcOffset(9);
    const currentYear: string = today.year().toString();
    const currentMonth: string = (today.month() + 1).toString();
    const monthHolidays: string[] = await this.holidayRepository.getHolidayDates(currentYear, currentMonth);
    if (monthHolidays.includes(today.format('YYYY-MM-DD'))) {
      return;
    }

    this.logger.log(`🚀 오늘의 출근 정보 자동 등록을 시작합니다. (현재시간: ${moment().utcOffset(9)}) !`);

    await this.schedulerRepository.insertCommutesForToday();

    this.logger.log('🏁 오늘의 출근 정보 자동 등록을 마칩니다. !');
  }

  /*
   * ✅ 전직원 총연차일 일괄 등록 ✅
   * 근속년수 0년차 직원: 부여받은 월차 개수 (= 작년 총연차일)
   * 근속년수 1년차 이상 직원: 기본 15개, 3년차부터 2년마다 1씩 증가 (해당 연도에 근속년수 3년, 5년..이 되는 직원도 모두 1씩 증가)
   * 기준일은 매년 1월 1일
   */
  // @Cron(CronExpression.EVERY_YEAR)
  // @Cron('0 08 16 * * * ')
  @Transactional()
  async insertReceivedAnnualLeave() {
    this.logger.log(`🚀 연차 자동 등록을 시작합니다. (현재시간: ${moment().utcOffset(9)}) !`);
    const currentYear: string = moment().utcOffset(9).year().toString();
    const users = await this.schedulerRepository.getAllUsersInfo();
    for (const user of users) {
      let totalReceivedAnnualLeave: number = 0;
      let totalAnnualLeaveUsage: number = 0;

      const { userIdx, joinDate } = user;
      const lastYear: string = (Number(currentYear) - 1).toString();
      const lastYearStats = await this.schedulerRepository.getUserLeaveStatsInfo(userIdx, lastYear); // 작년 연차 현황 조회
      const yearsSinceJoin: number = getYearsSinceJoin(joinDate); // 근속년수

      if (yearsSinceJoin < 1) {
        totalReceivedAnnualLeave = lastYearStats.totalAnnualLeaveBalance;
        totalAnnualLeaveUsage = 0;
      } else {
        const extraAnnualLeave = calculateExtraAnnualLeave(joinDate);
        totalReceivedAnnualLeave = 15 + extraAnnualLeave;
        totalAnnualLeaveUsage = 0;
      }

      // leaveStats 엔티티에 정보(총연차일, 사용개수) 추가
      const newLeaveStats: NewLeaveStats = {
        totalReceivedAnnualLeave,
        totalAnnualLeaveUsage,
        midJoinReceivedAnnualLeave: lastYearStats.midJoinReceivedAnnualLeave,
      };
      await this.schedulerRepository.insertLeaveStatsInfo(userIdx, currentYear, newLeaveStats);

      // leaveUsage 엔티티에 정보(default: 0) 추가
      await this.schedulerRepository.insertLeaveUsageInfo(userIdx, currentYear);

      // leaveMonthlyUsage 엔티티에 정보(default: 0) 추가
      await this.schedulerRepository.insertLeaveMonthlyUsageInfo(userIdx, currentYear);
    }

    this.logger.log('🏁 연차 자동 등록을 마칩니다. !');
  }

  /*
   * ✅ 월차 및 총연차일 업데이트 ✅
   * 입사일자는 1일, 16일로 고정
   * 근속년수 0년차 직원: 매달 월차 1일 자동 부여
   * 근속년수 딱 1년(입사 1주년) 직원: 총 연차일 업데이트 (지금까지의 총 연차 잔여개수 + (전년도 재직일수/365) * 15의 올림값)
   * 기준일은 today(오늘)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  @Transactional()
  async insertExtraReceivedAnnualLeaveForMidJoiner() {
    const today: moment.Moment = moment().utcOffset(9);
    const currentYear: number = today.year();
    const currentYearString: string = currentYear.toString();
    const users = await this.schedulerRepository.getAllUserWithLessThanOneYear(today.format('YYYY-MM-DD'));
    if (users.length === 0) return;

    for (const user of users) {
      const { userIdx, userName, joinDate } = user;
      this.logger.log(`🚀 중도입사자 ${userName}에 대한 월/연차 업데이트를 시작합니다.(현재시간: ${today}) !`);

      const leaveGrantType: LeaveGrantTypeEnum = getTodayLeaveGrantType(joinDate, today);

      // 입사 1주년 직원의 경우,
      if (leaveGrantType === LeaveGrantTypeEnum.ANNUAL) {
        const endDayofLastYear: string = `${currentYear - 1}-12-31`; // 전년도 마지막 날
        const lastYearWorkDays: number = getDaysBetwweenTwoDates(joinDate, endDayofLastYear); // 재직일수
        const midJoinReceivedAnnualLeave: number = Math.ceil((lastYearWorkDays / 365) * 15); // 중도입사연차 수 (전년도 재직일수/365) * 15의 올림값)
        const leaveStats = await this.schedulerRepository.getUserLeaveStatsInfo(userIdx, currentYearString);
        const totalAnnualLeaveBalance: number = leaveStats.totalAnnualLeaveBalance; // 지금까지의 총 연차 잔여개수

        const updateLeaveStats: NewLeaveStats = {
          totalReceivedAnnualLeave: totalAnnualLeaveBalance + midJoinReceivedAnnualLeave,
          totalAnnualLeaveUsage: 0,
          midJoinReceivedAnnualLeave,
        };
        await this.schedulerRepository.updateLeaveStatsInfo(userIdx, currentYearString, updateLeaveStats);
      }

      // 근속년수 0년차 직원의 경우,
      if (leaveGrantType === LeaveGrantTypeEnum.MONTHLY) {
        const leaveStats = await this.schedulerRepository.getUserLeaveStatsInfo(userIdx, currentYearString);
        const updatedTotalReceivedAnnualLeave = leaveStats.totalReceivedAnnualLeave + 1; // 월차 1일 부여

        const updateLeaveStats: NewLeaveStats = {
          totalReceivedAnnualLeave: updatedTotalReceivedAnnualLeave,
          totalAnnualLeaveUsage: leaveStats.totalAnnualLeaveUsage,
          midJoinReceivedAnnualLeave: 0,
        };
        await this.schedulerRepository.updateLeaveStatsInfo(userIdx, currentYearString, updateLeaveStats);
      }
    }

    this.logger.log('🏁 월/연차 업데이트를 모두 마칩니다. !');
  }
}
