import { ActivityMonthlyStatsEntity } from '../../../entity/activity/activityMonthlyStats.entity';

type RequiredFields = 'userIdx' | 'year' | 'month' | 'activityMonthExpense';

type NewActivityMonthStatsType = Pick<ActivityMonthlyStatsEntity, RequiredFields>;

export interface NewActivityMonthStats extends NewActivityMonthStatsType {}
