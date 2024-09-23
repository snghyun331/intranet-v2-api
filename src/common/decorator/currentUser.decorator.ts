import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserTokenDto } from '../dto/token.dto';

export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext): UserTokenDto => {
  const req: any = ctx.switchToHttp().getRequest();
  return req.user;
});

export const CurrentUserIdx = createParamDecorator((data, ctx: ExecutionContext): string => {
  const req: any = ctx.switchToHttp().getRequest();
  return req.user.userIdx;
});
