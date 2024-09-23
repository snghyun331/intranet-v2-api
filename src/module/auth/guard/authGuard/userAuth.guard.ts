import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { UNAUTHORIZED } from '../../../../common/error/unauthorized.error';

@Injectable()
export class UserAuthGuard extends AuthGuard('user') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    if (err || !user) {
      if (err instanceof JsonWebTokenError && err.message === 'jwt must be provided') {
        throw new UnauthorizedException(UNAUTHORIZED.NO_TOKEN.KOR);
      }
      if (err instanceof TokenExpiredError) {
        throw new UnauthorizedException(UNAUTHORIZED.TOKEN_EXPIRED.KOR);
      }
      if (err instanceof JsonWebTokenError || err instanceof SyntaxError) {
        throw new UnauthorizedException(`${UNAUTHORIZED.TOKEN_INVALID.KOR} (${err.message})`);
      }
      throw new UnauthorizedException(UNAUTHORIZED.UNKNOWN.KOR);
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
