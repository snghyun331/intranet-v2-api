import { BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationErrorBody, ValidationErrorDetail } from '@common/interface/validation.interface';

export const validationOptions = {
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const logger = new Logger();
    const details: ValidationErrorDetail[] = [];

    for (const { property, constraints } of validationErrors) {
      const keys: string[] = Object.keys(constraints);
      logger.error(
        `에러 발생 키 : ${property}, 에러 제목 : ${keys} , 에러 내용 : ${Object.values(constraints)}`,
        '🚧🚧🚧🚧 유효성 검사 에러 🚧🚧🚧🚧',
      );
      const errObject: ValidationErrorDetail = { field: property, error: Object.values(constraints) };
      details.push(errObject);
    }

    const validationErrResponseBody: ValidationErrorBody = {
      statusCode: 400,
      message: '요청 입력 값이 잘못되었습니다.',
      details,
      error: 'Validation Error',
    };

    throw new BadRequestException(validationErrResponseBody);
  },
};
