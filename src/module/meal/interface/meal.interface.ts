import { AttendanceEnum, MealTypeEnum, UserGradeEnum, YNEnum } from '../../../common/constant/enum';

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

export interface MealAdminInfo {
  mealIdx: number;
  gradeName: string;
  userIdx: number;
  userName: string;
  place: string;
  targetDay: string;
  mealType: MealTypeEnum;
  amount: number;
  payerName: string;
  attendance: AttendanceEnum;
}

export interface MealBudgetAdminInfo {
  mealStatsIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  mealBudget: number;
  note: string;
  year: string;
  month: string;
}
