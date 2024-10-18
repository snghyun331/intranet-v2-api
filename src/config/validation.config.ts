import { BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ValidationDetailDto, ValidationErrorBodyDto } from '../common/dto/validationError.dto';

/*  validateErr Key가 isNotEmpty일 경우, 해당 값이 에러메세지로 전달됩니다. */
export const validationOptions = {
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const logger = new Logger();
    const details: ValidationDetailDto[] = [];

    for (const { property, constraints } of validationErrors) {
      const keys: string[] = Object.keys(constraints);
      logger.warn(
        `에러 발생 키 : ${property}, 에러 제목 : ${keys} , 에러 내용 : ${Object.values(constraints)}`,
        '🚧🚧🚧🚧 유효성 검사 에러 🚧🚧🚧🚧',
      );
      const errObject: ValidationDetailDto = { field: property, error: Object.values(constraints) };
      details.push(errObject);
    }

    const validationErrResponseBody: ValidationErrorBodyDto = {
      statusCode: 400,
      message: '요청 입력 값이 잘못되었습니다.',
      details,
      error: 'Validation Error',
    };

    throw new BadRequestException(validationErrResponseBody);
  },
};
