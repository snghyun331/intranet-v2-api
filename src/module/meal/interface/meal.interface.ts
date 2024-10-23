import { YNEnum } from '../../../common/constant/enum';

export interface BasicMealData {
  payerName: string;
  place: string;
  amount: number;
  attendance?: string;
}

export interface DetailedMealData extends BasicMealData {
  holidayYN?: YNEnum;
}

export interface MealStats {
  year: string;
  month: string;
  mealBudget: number;
  mealExpense: number;
  mealBalance: number;
  userName: string;
}
