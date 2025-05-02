import { SetMetadata } from '@nestjs/common';
import { AdminGradeEnum, UserGradeEnum } from '@common/constant/enum';

export const UserRole = (role: UserGradeEnum) => SetMetadata('roles', role);

export const AdminRole = (role: AdminGradeEnum) => SetMetadata('roles', role);
