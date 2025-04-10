import {
  MealAttendanceEnum,
  ClearStatusEnum,
  HalfYearEnum,
  MealTypeEnum,
  UserGradeEnum,
  YNEnum,
} from '../../../common/constant/enum';

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
}

export interface MealAdminInfo {
  mealIdx: number;
  gradeName: string;
  teamName: string;
  userIdx: number;
  userName: string;
  place: string;
  targetDay: string;
  mealType: MealTypeEnum;
  amount: number;
  payerName: string;
  attendance: MealAttendanceEnum;
  leaveTypeIdx: number;
  leaveTypeName: string;
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

export interface MealStatsAdminInfo {
  mealStatsIdx: number;
  year: string;
  halfYear: HalfYearEnum;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  mealBudget: number;
  mealExpense: number;
  mealBalance: number;
  breakfastExpense: number;
  dinnerExpense: number;
  breakfastOverpay: number;
  mealOverpay: number;
  dinnerOverpay: number;
  totalOverpay: number;
  workdays: number;
  holidays: number;
  timeoffDays: number;
  holidayWorkdays: number;
  note: string;
  clearStatus: ClearStatusEnum;
}
