import { WithOptional } from '../../../common/utils/type';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';

type RequiredFields = 'year' | 'month' | 'workdays' | 'userIdx' | 'holidays';
type OptionalFields = 'userIdx' | 'holidays';
type NewMealStatsType = WithOptional<Pick<MealStatsEntity, RequiredFields>, OptionalFields>;

export interface NewMealStats extends NewMealStatsType {}
