import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { YNEnum } from '../../../../common/constant/enum';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const { adminRole } = context.switchToHttp().getRequest().user;

    if (adminRole !== YNEnum.YES) {
      throw new ForbiddenException('어드민 접근 권한이 없습니다.');
    }

    return true;
  }
}
