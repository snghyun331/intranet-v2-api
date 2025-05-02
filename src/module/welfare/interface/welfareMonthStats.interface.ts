import { WelfareMonthlyStatsEntity } from '@entity/welfare/welfareMonthlyStats.entity';

type RequiredFields = 'userIdx' | 'year' | 'month' | 'welfareMonthExpense';

type NewWelfareMonthStatsType = Pick<WelfareMonthlyStatsEntity, RequiredFields>;

export interface NewWelfareMonthStats extends NewWelfareMonthStatsType {}
