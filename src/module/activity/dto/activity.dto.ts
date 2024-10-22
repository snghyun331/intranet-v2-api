import { PickType } from '@nestjs/swagger';
import { ActivityEntity } from '../../../entity/activity/activity.entity';

export class ActivityInfoDto extends PickType(ActivityEntity, [
  'activityIdx',
  'userIdx',
  'targetDay',
  'payerName',
] as const) {}

// export class ActivityStatsDto extends IntersectionType(
//     PickType(ActivityStatsEntity, ['year', 'welfareBudget', 'welfareExpense', 'welfareBalance'] as const),
//     PickType(UserEntity, ['userName'] as const),
//   ) {}

// export class GetActivityDto {
//   @ValidateNested()
//   @Type(() => ActivityStatsDto)
//   activityStats: ActivityStatsDto;

//   @IsArray()
//   activities: Welfares[];
// }
