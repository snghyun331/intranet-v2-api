import { BadRequestException, Logger } from '@nestjs/common';
import { ValidationError } from 'class-validator';

/*  validateErr Key가 isNotEmpty일 경우, 해당 값이 에러메세지로 전달됩니다. */
export const validationOptions = {
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const logger = new Logger();
    let errMessage: string = '';
    let hasSpecificConstraint: boolean = false;

    for (const { property, constraints } of validationErrors) {
      const keys = Object.keys(constraints);

      if (keys.includes('isNotEmpty') || keys.includes('matches')) {
        if (keys.includes('isNotEmpty')) {
          errMessage += constraints['isNotEmpty'] + ' ';
        }

        if (keys.includes('matches')) {
          errMessage += constraints['matches'] + ' ';
        }
        hasSpecificConstraint = true;
      }

      logger.warn(
        `에러 발생 키 : ${property}, 에러 제목 : ${keys} , 에러 내용 : ${Object.values(constraints)}`,
        '🚧🚧🚧🚧 유효성 검사 에러 🚧🚧🚧🚧',
      );

      if (!hasSpecificConstraint) {
        errMessage = '요청 입력 값이 잘못되었습니다.';
      }
    }

    throw new BadRequestException(errMessage.trim());
    // throw new BadRequestException(Object.values(constraints));
  },
};
