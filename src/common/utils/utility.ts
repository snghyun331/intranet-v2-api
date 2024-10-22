import { BadRequestException } from '@nestjs/common';
import * as moment from 'moment';

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

export const getStartAndLastDayofMonth = (year: number, month: number) => {
  // 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth: moment.Moment = moment({ year: year, month: month - 1 })
    .startOf('month')
    .utcOffset(9);

  const lastDayOfMonth: moment.Moment = moment(firstDayOfMonth).endOf('month').utcOffset(9);

  return { firstDayOfMonth, lastDayOfMonth };
};

export const getTotalDaysInMonth = (year: number, month: number): number => {
  const { lastDayOfMonth } = getStartAndLastDayofMonth(year, month);
  const totalDays: number = lastDayOfMonth.date();

  return totalDays;
};
