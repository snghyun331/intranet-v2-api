import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { UserGradeEnum } from '@common/constant/enum';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requireRole: UserGradeEnum = this.reflector.get<UserGradeEnum>('roles', context.getHandler());
    const { gradeName } = context.switchToHttp().getRequest().user;
    const userGradeList: UserGradeEnum[] = Object.values(UserGradeEnum);

    const [loginUserRole, permissionLevel] = [userGradeList.indexOf(gradeName), userGradeList.indexOf(requireRole)];
    if (loginUserRole > permissionLevel) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return loginUserRole <= permissionLevel;
  }
}
