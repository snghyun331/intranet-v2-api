import { IntersectionType, PickType } from '@nestjs/swagger';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { UserEntity } from '../../../entity/user/user.entity';

export class UserDto extends PickType(IntersectionType(UserEntity, HeadquarterEntity, TeamEntity, GradeEntity), [
  'id',
  'password',
  'userIdx',
  'userName',
  'userGender',
  'userBirth',
  'joinDate',
  'hqName',
  'teamName',
  'gradeName',
] as const) {}
