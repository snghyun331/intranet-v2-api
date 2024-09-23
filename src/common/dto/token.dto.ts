import { IntersectionType, PickType } from '@nestjs/swagger';
import { UserEntity } from '../../entity/user/user.entity';
import { HeadquarterEntity } from '../../entity/user/headquarter.entity';
import { TeamEntity } from '../../entity/user/team.entity';
import { GradeEntity } from '../../entity/user/grade.entity';

export class UserTokenDto extends PickType(IntersectionType(UserEntity, HeadquarterEntity, TeamEntity, GradeEntity), [
  'userIdx',
  'userName',
  'userGender',
  'userBirth',
  'joinDate',
  'hqName',
  'teamName',
  'gradeName',
] as const) {}
