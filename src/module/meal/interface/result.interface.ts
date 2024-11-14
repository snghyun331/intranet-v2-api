import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { MealAdminInfo, MealBudgetAdminInfo, MealStats } from './meal.interface';

export interface MealCalenderResult {
  mealStats: MealStats;
  meals: any[];
}

export interface MealAdminResult extends TotalPageInfo {
  meal: MealAdminInfo[];
}

export interface MealBudgetTotalPageInfo extends TotalPageInfo {
  mealBudget: MealBudgetAdminInfo[];
}

export interface MealBudgetAdminResult extends MealBudgetTotalPageInfo {
  workdays: number;
}
