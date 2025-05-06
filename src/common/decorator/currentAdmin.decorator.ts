import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminPayload } from '@common/interface/payload.interface';

export const CurrentAdmin = createParamDecorator((data, ctx: ExecutionContext): AdminPayload => {
  const req: any = ctx.switchToHttp().getRequest();
  return req.user;
});
