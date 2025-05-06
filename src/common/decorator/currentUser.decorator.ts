import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserPayload } from '@common/interface/payload.interface';

export const CurrentUser = createParamDecorator((data, ctx: ExecutionContext): UserPayload => {
  const req: any = ctx.switchToHttp().getRequest();

  return req.user;
});

export const CurrentUserIdx = createParamDecorator((data, ctx: ExecutionContext): string => {
  const req: any = ctx.switchToHttp().getRequest();

  return req.user.userIdx;
});
