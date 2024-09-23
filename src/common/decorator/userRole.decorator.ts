import { SetMetadata } from '@nestjs/common';
import { UserGradeEnum } from '../constant/enum';

export const UserRole = (role: UserGradeEnum) => SetMetadata('roles', role);
