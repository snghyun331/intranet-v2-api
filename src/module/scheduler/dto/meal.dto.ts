import { PickType } from '@nestjs/swagger';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';

export class NewMealStatsDto extends PickType(MealStatsEntity, [
  'userIdx',
  'year',
  'month',
  'workdays',
  'holidays',
  'mealBudget',
] as const) {}
