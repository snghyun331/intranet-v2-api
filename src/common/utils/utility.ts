import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { AES, enc } from 'crypto-js';
import { ConfirmEnum, HalfYearEnum } from '../constant/enum';

// 특정 문자 객체를 YYYY-MM-DD 형태로 만든다
export const getDateFormYYYYMMDD = (dateString: string): string => {
  if (dateString.length !== 8) {
    throw new BadRequestException('유효하지 않는 date string 포맷입니다.');
  }
  const year: string = dateString.substring(0, 4);
  const month: string = dateString.substring(4, 6);
  const day: string = dateString.substring(6, 8);

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
  console.log(joinDateString);
  const joinDate = moment(joinDateString).utcOffset(9);
  const oneYearAfterJoin: string = joinDate.add(1, 'years').subtract(1, 'days').format('YYYY-MM-DD');

  return oneYearAfterJoin;
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
