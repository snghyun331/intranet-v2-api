import { WithOptional } from '@common/utils/type';
import { ActivityStatsEntity } from '@entity/activity/activityStats.entity';

type RequiredFields = 'year' | 'userIdx' | 'halfYear' | 'activityBudget';

type OptionalFields = 'userIdx';

type NewActivityStatsType = WithOptional<Pick<ActivityStatsEntity, RequiredFields>, OptionalFields>;

export interface NewActivityStats extends NewActivityStatsType {}
