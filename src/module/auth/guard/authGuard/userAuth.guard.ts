import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { UNAUTHORIZED } from '../../../../common/error/unauthorized.error';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserPayload } from '../../../../common/interface/token.interface';

@Injectable()
export class UserAuthGuard extends AuthGuard('user') {
  handleRequest(err: any, user: any, info: any, context: any, status: any) {
    const request: Request = context.switchToHttp().getRequest();

    if (err || !user) {
      if (err instanceof JsonWebTokenError && err.message === 'jwt must be provided') {
        throw new UnauthorizedException(UNAUTHORIZED.NO_TOKEN.KOR);
      }
      if (err instanceof TokenExpiredError) {
        // 토큰이 만료되어도 로그아웃 가능하게
        if (request.path === '/logout') {
          const userToken: string = request.headers['authorization']?.slice(7);
          const decodedInfo: UserPayload = jwt.decode(userToken) as UserPayload;

          return decodedInfo;
        } else {
          throw new UnauthorizedException(UNAUTHORIZED.TOKEN_EXPIRED.KOR);
        }
      }
      if (err instanceof JsonWebTokenError || err instanceof SyntaxError) {
        throw new UnauthorizedException(`${UNAUTHORIZED.TOKEN_INVALID.KOR} (${err.message})`);
      }
      throw new UnauthorizedException(UNAUTHORIZED.UNKNOWN.KOR);
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
