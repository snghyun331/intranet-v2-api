import { WithOptional } from '@common/utils/type';
import { WelfareStatsEntity } from '@entity/welfare/welfareStats.entity';

type RequiredFields = 'year' | 'userIdx' | 'halfYear' | 'welfareBudget';

type OptionalFields = 'userIdx';

type NewWelfareStatsType = WithOptional<Pick<WelfareStatsEntity, RequiredFields>, OptionalFields>;

export interface NewWelfareStats extends NewWelfareStatsType {}
