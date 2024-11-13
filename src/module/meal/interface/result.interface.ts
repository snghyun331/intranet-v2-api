import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { MealAdminInfo, MealStats } from './meal.interface';

export interface MealCalenderResult {
  mealStats: MealStats;
  meals: any[];
}

export interface MealAdminResult extends TotalPageInfo {
  meal: MealAdminInfo[];
}
