import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as moment from 'moment';
import { AES, enc } from 'crypto-js';

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

export const getStartAndEndDateByMonth = (year: number, month: number) => {
  // 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth: moment.Moment = moment({ year: year, month: month - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment(firstDayOfMonth).endOf('month').utcOffset(9);

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getStartAndEndDateByMonths = (year: number, monthArray: string[]) => {
  // 배열로 입력된 월 기준으로 시작일과 종료일 계산
  const minMonth: number = Math.min(...monthArray.map(Number));
  const maxMonth: number = Math.max(...monthArray.map(Number));

  const firstDayOfMonth: moment.Moment = moment({ year: year, month: minMonth - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment({ year: year, month: maxMonth - 1 })
    .endOf('month')
    .utcOffset(9);

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getTotalDaysInMonth = (year: number, month: number): number => {
  const { lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
  const totalDays: number = lastDayOfMonth.date();

  return totalDays;
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
