import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

export const errSeparation = (statusCode: number, errMsg: string) => {
  switch (statusCode) {
    case 400:
      throw new BadRequestException(errMsg);
    case 401:
      throw new UnauthorizedException(errMsg);
    case 403:
      throw new ForbiddenException(errMsg);
    case 409:
      throw new ConflictException(errMsg);
    default:
      throw new InternalServerErrorException('서버 에러');
  }
};

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
