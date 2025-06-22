import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { AES, enc } from 'crypto-js';
import { ConfirmEnum, HalfYearEnum, LeaveGrantTypeEnum } from '@common/constant/enum';
import {
  AM_QUARTER_REST_LISTS,
  AM_REST_LISTS,
  FOUR_HOURS_WORKING_MINUTES,
  FULL_DAY_REST_LISTS,
  NORMAL_WORKING_MINUTES,
  PM_QUARTER_REST_LISTS,
  PM_REST_LISTS,
  SEVEN_HOURS_WORKING_MINUTES,
  THREE_HOURS_WORKING_MINUTES,
  TWO_HOURS_HALF_WORKIMG_MINUTES,
} from '../constant/constant';

// 특정 문자 객체를 YYYY-MM-DD 형태로 만든다
export const getDateFormYYYYMMDD = (yyyymmdd: string): string => {
  if (yyyymmdd.length !== 8) {
    throw new BadRequestException('유효하지 않는 date string 포맷입니다.');
  }
  const year: string = yyyymmdd.substring(0, 4);
  const month: string = yyyymmdd.substring(4, 6);
  const day: string = yyyymmdd.substring(6, 8);

  return `${year}-${month}-${day}`;
};

export const getWeekendDates = (year: number, month: number): string[] => {
  // 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth: moment.Moment = moment({ year: year, month: month - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment(firstDayOfMonth).endOf('month').utcOffset(9);

  const weekends: string[] = [];
  const currentDate: moment.Moment = firstDayOfMonth;
  // 현재 날짜가 마지막 날보다 크지 않을 때까지 반복
  while (currentDate <= lastDayOfMonth) {
    const dayOfWeek: number = currentDate.day();
    // 토요일(6) 또는 일요일(0)이면 주말에 추가
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekends.push(currentDate.format('YYYY-MM-DD'));
    }
    // 날짜를 하루씩 증가
    currentDate.add(1, 'day');
  }

  return weekends;
};

export const getStartAndEndDateByMonth = (year: string, month: string) => {
  // 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth: moment.Moment = moment({ year: Number(year), month: Number(month) - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment(firstDayOfMonth).endOf('month').utcOffset(9);

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getStartAndEndDateByMonths = (year: string, monthArray: string[]) => {
  // 배열로 입력된 월 기준으로 시작일과 종료일 계산
  const minMonth: number = Math.min(...monthArray.map(Number));
  const maxMonth: number = Math.max(...monthArray.map(Number));

  const firstDayOfMonth: moment.Moment = moment({ year: Number(year), month: minMonth - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment({ year: Number(year), month: maxMonth - 1 })
    .endOf('month')
    .utcOffset(9);

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getStartAndEndDateByHalfYear = (year: string, halfYear: HalfYearEnum) => {
  let firstDayOfMonth: moment.Moment;
  let lastDayOfMonth: moment.Moment;

  // 상반기의 첫날과 마지막 날 계산
  if (halfYear === HalfYearEnum.H1) {
    firstDayOfMonth = moment({ year: Number(year), month: 0 })
      .startOf('month')
      .utcOffset(9);

    lastDayOfMonth = moment({ year: Number(year), month: 5 })
      .endOf('month')
      .utcOffset(9);
  } else {
    // 하반기의 첫날과 마지막 날 계산
    firstDayOfMonth = moment({ year: Number(year), month: 6 })
      .startOf('month')
      .utcOffset(9);

    lastDayOfMonth = moment({ year: Number(year), month: 11 })
      .endOf('month')
      .utcOffset(9);
  }

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getStartAndEndDateByYear = (year: string) => {
  // 월의 첫 날과 마지막 날 계산
  const firstDayOfYear: string = `${year}-01-01`;
  const lastDayOfYear: string = `${year}-12-31`;

  return { firstDayOfYear, lastDayOfYear };
};

export const getTotalDaysInMonth = (year: string, month: string): number => {
  const { lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
  const totalDays: number = lastDayOfMonth.date();

  return totalDays;
};

export const substringYearMonth = (dateString: string): { year: string; month: string } => {
  const year: string = dateString.substring(0, 4);
  const month: string = parseInt(dateString.substring(5, 7), 10).toString();

  return { year, month };
};

// 검색어 양 끝 및 중간 공백 제거
export const removeAllWhiteSpace = (searchWord: string) => {
  const removeWhiteSpaceReg: RegExp = /(\s*)/g;
  const filteredWords: string = searchWord.replace(removeWhiteSpaceReg, '');

  return filteredWords;
};

// pw 암호화
export const encryptPassword = (originalText: string): string => {
  const authKey: string = new ConfigService().get<string>('AUTH_KEY_AES');
  const encryptedText: string = AES.encrypt(originalText, authKey).toString();

  return encryptedText;
};

// pw 복호화
export const decryptPassword = (encryptedValue: string): string => {
  try {
    const authKey: string = new ConfigService().get<string>('AUTH_KEY_AES');
    const bytes = AES.decrypt(encryptedValue, authKey);
    const decryptedText: string = bytes.toString(enc.Utf8);

    return decryptedText;
  } catch (err) {
    console.error(err);
    throw new BadRequestException('잘못된 비밀번호 입니다.');
  }
};

export const getNormalLateBoundary = (timestamp: Date): Date => {
  // 정상, 오후 반반차
  const boundary: Date = new Date(new Date(timestamp).setHours(10, 0, 0, 0));

  return boundary;
};

export const getAmQuarterLateBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(11, 0, 0, 0));

  return boundary;
};

export const getAmHalfLateBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(14, 30, 0, 0));

  return boundary;
};

export const getPmHalfLateBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(9, 30, 0, 0));

  return boundary;
};

export const getAmHalfEarlyBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(13, 30, 0, 0));

  return boundary;
};

export const getAmQuarterEarlyBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(10, 0, 0, 0));

  return boundary;
};

export const getNormalEarlyBoundary = (timestamp: Date): Date => {
  const boundary: Date = new Date(timestamp.setHours(8, 0, 0, 0));

  return boundary;
};

// 근속년수 계산
export const getYearsSinceJoin = (joinDateString: string): number => {
  const now: moment.Moment = moment().utcOffset(9);
  const joinDate = moment(joinDateString).utcOffset(9);
  const yearsSinceJoin: number = now.diff(joinDate, 'years');

  return yearsSinceJoin;
};

// 입사 후 만 1년 날짜 계산
export const getOneYearAfterJoin = (joinDateString: string): string => {
  const joinDate = moment(joinDateString).utcOffset(9);
  const oneYearAfterJoin: string = joinDate.add(1, 'years').subtract(1, 'days').format('YYYY-MM-DD');

  return oneYearAfterJoin;
};

export const getEndOfYear = (dateString: string): string => {
  const date = moment(dateString).utcOffset(9);
  const endOfYear: string = date.endOf('year').format('YYYY-MM-DD');

  return endOfYear;
};

// 날짜 간 월 수 차이
export const getMonthsDifferenceFromToday = (targetDateString: string): number => {
  const today = moment();
  const target = moment(targetDateString);

  return Math.abs(target.diff(today, 'months'));
};

export const calculateExtraAnnualLeave = (joinDateString: string): number => {
  const joinDate: moment.Moment = moment(joinDateString).utcOffset(9);

  // 올해 말 기준 근속년수 계산 (당일 기준 근속년수 계산은 getYearsSinceJoin함수)
  const endOfYear = moment().utcOffset(9).endOf('year');
  const yearsSinceJoinUntilEndOfYear: number = endOfYear.diff(joinDate, 'years', true); // 소수점 포함

  if (yearsSinceJoinUntilEndOfYear < 3) {
    return 0;
  }

  // 3년차부터 2년마다 연차 1씩 증가
  const extraAnnualLeave: number = Math.floor((yearsSinceJoinUntilEndOfYear - 1) / 2);

  return extraAnnualLeave;
};

export const addConfirmStatusField = (confirmYN: ConfirmEnum, confirmDate: string, rejectDate: string): string => {
  switch (confirmYN) {
    case ConfirmEnum.NO:
      return '승인 대기';
    case ConfirmEnum.YES:
      return `${confirmDate}`;
    case ConfirmEnum.REJECT:
      return `반려 ${rejectDate}`;
  }
};

export const removeDuplicateIdxs = (array: any[], originalArray: any[]): any[] => {
  return originalArray.filter((item) => !array.includes(item));
};

/*
 * 총 근무일수가 365일 이하인 직원 대상
 * - 오늘이 입사 1주년이면: ANNUAL
 * - 오늘이 매월 입사일과 같은 날이면: MONTHLY
 * - 위 둘 모두 해당하지 않으면: NONE
 */
export const getTodayLeaveGrantType = (joinDateString: string, today: moment.Moment): LeaveGrantTypeEnum => {
  const joinDate = moment(joinDateString).utcOffset(9);
  const joinOneYearLater = joinDate.clone().add(1, 'year').format('YYYY-MM-DD');

  // 입사 1주년에 해당하면
  if (today.format('YYYY-MM-DD') === joinOneYearLater) {
    return LeaveGrantTypeEnum.ANNUAL;
  }
  // 월차에 해당하면
  if (today.date() === joinDate.date()) {
    return LeaveGrantTypeEnum.MONTHLY;
  }

  return LeaveGrantTypeEnum.NONE;
};

export const getDaysBetwweenTwoDates = (startDate: string, endDate: string): number => {
  const start: Date = new Date(startDate);
  const end: Date = new Date(endDate);
  const days: number = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return days;
};

export const addMinutes = (date: Date, minutes: number): Date => {
  const result: Date = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);

  return result;
};

export const getDaysInMonth = (year: string, month: string): number => {
  return moment(`${year}-${month}`, 'YYYY-MM').daysInMonth();
};

export const calculateAvailCheckOutTime = (
  checkInTime: Date,
  leaveTypeIdx: number | null,
  confirmYN: ConfirmEnum,
): Date => {
  let standardWorkingMinutes: number;

  if (confirmYN === ConfirmEnum.NO || confirmYN === ConfirmEnum.REJECT) {
    standardWorkingMinutes = NORMAL_WORKING_MINUTES;
  } else {
    if (AM_REST_LISTS.has(leaveTypeIdx) || PM_REST_LISTS.has(leaveTypeIdx)) {
      standardWorkingMinutes = FOUR_HOURS_WORKING_MINUTES;
    } else if (AM_QUARTER_REST_LISTS.has(leaveTypeIdx) || PM_QUARTER_REST_LISTS.has(leaveTypeIdx)) {
      standardWorkingMinutes = SEVEN_HOURS_WORKING_MINUTES;
    } else {
      standardWorkingMinutes = NORMAL_WORKING_MINUTES;
    }
  }

  const availCheckOutTime = addMinutes(checkInTime, standardWorkingMinutes);

  return availCheckOutTime;
};

export const calculateCombinedCommuteAvailCheckOutTime = (
  checkInTime: Date,
  firstLeaveTypeIdx: number,
  secondLeaveTypeIdx: number,
) => {
  const standardWorkingMinutes: number = calculateCombinedLeaveStandardWorkingMinutes(
    firstLeaveTypeIdx,
    secondLeaveTypeIdx,
  );
  const availCheckOutTime = addMinutes(checkInTime, standardWorkingMinutes);

  return availCheckOutTime;
};

export const calculateSingleCommuteAvailCheckOutTime = (checkInTime: Date, leaveTypeIdx: number) => {
  const standardWorkingMinutes: number = calculateSingleLeaveStandardWorkingMinutes(leaveTypeIdx);
  const availCheckOutTime = addMinutes(checkInTime, standardWorkingMinutes);

  return availCheckOutTime;
};

export const calculateSingleLeaveStandardWorkingMinutes = (leaveTypeIdx: number) => {
  let standardWorkingMinutes: number;

  if (AM_REST_LISTS.has(leaveTypeIdx) || PM_REST_LISTS.has(leaveTypeIdx)) {
    standardWorkingMinutes = FOUR_HOURS_WORKING_MINUTES;
  } else if (AM_QUARTER_REST_LISTS.has(leaveTypeIdx) || PM_QUARTER_REST_LISTS.has(leaveTypeIdx)) {
    standardWorkingMinutes = SEVEN_HOURS_WORKING_MINUTES;
  } else {
    standardWorkingMinutes = NORMAL_WORKING_MINUTES;
  }

  return standardWorkingMinutes;
};

export const calculateCombinedLeaveStandardWorkingMinutes = (existLeaveTypeIdx: number, newLeaveTypeIdx: number) => {
  let standardWorkingMinutes: number;
  // 기존 휴가와 새 휴가 타입 분류
  const isExistAmHalf = AM_REST_LISTS.has(existLeaveTypeIdx);
  const isExistPmHalf = PM_REST_LISTS.has(existLeaveTypeIdx);
  const isExistAmQuarter = AM_QUARTER_REST_LISTS.has(existLeaveTypeIdx);
  const isExistPmQuarter = PM_QUARTER_REST_LISTS.has(existLeaveTypeIdx);
  const isExistAmLeave = isExistAmHalf || isExistAmQuarter;
  const isExistPmLeave = isExistPmHalf || isExistPmQuarter;

  const isNewAmHalf = AM_REST_LISTS.has(newLeaveTypeIdx);
  const isNewPmHalf = PM_REST_LISTS.has(newLeaveTypeIdx);
  const isNewAmQuarter = AM_QUARTER_REST_LISTS.has(newLeaveTypeIdx);
  const isNewPmQuarter = PM_QUARTER_REST_LISTS.has(newLeaveTypeIdx);
  const isNewAmLeave = isNewAmHalf || isNewAmQuarter;
  const isNewPmLeave = isNewPmHalf || isNewPmQuarter;

  // 조합 케이스별 근무시간 계산
  if (isExistAmHalf && isNewPmHalf) {
    // 오전반차 + 오후반차 = 0시간 (종일 휴가)
    standardWorkingMinutes = 0;
  } else if (isExistPmHalf && isNewAmHalf) {
    // 오후반차 + 오전반차 = 0시간 (종일 휴가)
    standardWorkingMinutes = 0;
  } else if (isExistAmQuarter && isNewPmQuarter) {
    // 오전반반차 + 오후반반차 = 4시간
    standardWorkingMinutes = FOUR_HOURS_WORKING_MINUTES;
  } else if (isExistPmQuarter && isNewAmQuarter) {
    // 오후반반차 + 오전반반차 = 4시간
    standardWorkingMinutes = FOUR_HOURS_WORKING_MINUTES;
  } else if (isExistAmHalf && isNewPmQuarter) {
    // 오전반차 + 오후반반차 = 2.5시간
    standardWorkingMinutes = TWO_HOURS_HALF_WORKIMG_MINUTES;
  } else if (isExistPmQuarter && isNewAmHalf) {
    // 오후반반차 + 오전반차 = 2.5시간
    standardWorkingMinutes = TWO_HOURS_HALF_WORKIMG_MINUTES;
  } else if (isExistPmHalf && isNewAmQuarter) {
    // 오후반차 + 오전반반차 = 2.5시간
    standardWorkingMinutes = TWO_HOURS_HALF_WORKIMG_MINUTES;
  } else if (isExistAmQuarter && isNewPmHalf) {
    // 오전반반차 + 오후반차 = 2.5시간
    standardWorkingMinutes = TWO_HOURS_HALF_WORKIMG_MINUTES;
  } else if ((isExistAmLeave && isNewAmLeave) || (isExistPmLeave && isNewPmLeave)) {
    // 같은 시간대 중복 (오전+오전 또는 오후+오후)
    throw new BadRequestException('같은 시간대의 휴가는 중복해서 사용할 수 없습니다.');
  }

  return standardWorkingMinutes;
};
