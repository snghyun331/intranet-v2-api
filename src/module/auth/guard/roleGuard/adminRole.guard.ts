import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AdminGradeEnum } from '../../../../common/constant/enum';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const requireRole = this.reflector.get<AdminGradeEnum>('roles', context.getHandler());
    const { adminGradeName } = context.switchToHttp().getRequest().user;
    const adminGradeList: AdminGradeEnum[] = Object.values(AdminGradeEnum);

    const [loginAdminRole, permissionLevel] = [
      adminGradeList.indexOf(adminGradeName),
      adminGradeList.indexOf(requireRole),
    ];
    if (loginAdminRole > permissionLevel) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    return loginAdminRole <= permissionLevel;
  }
}
