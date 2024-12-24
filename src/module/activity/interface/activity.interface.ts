import { ClearStatusEnum, ConfirmEnum, HalfYearEnum, UserGradeEnum } from '../../../common/constant/enum';

export interface ActivityInfo {
  activityIdx: number;
  userIdx: number;
  targetDay: string;
  payerName: string;
}

export interface Activities extends ActivityInfo {
  userName: string;
  content: string;
  amount: number;
  confirmYN: ConfirmEnum;
}

export interface ActivityStats {
  year: string;
  halfYear: HalfYearEnum;
  activityBudget: number;
  activityExpense: number;
  activityBalance: number;
  teamName: string;
  hqName: string;
}

export interface AdminActivity {
  activityIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  targetDay: string;
  content: string;
  amount: number;
  payerName: string;
  confirmYN: ConfirmEnum;
  confirmDate: string;
}

export interface NewActivityMonthStats {
  userIdx: number;
  year: string;
  month: string;
  activityMonthExpense: number;
}

export interface NewActivityStats {
  userIdx: number;
  year: string;
  halfYear: HalfYearEnum;
  activityBudget: number;
}

export interface ActivityStatsAdminInfo {
  activityStatsIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  activityBudget: number;
  activityExpense: number;
  activityBalance: number;
  note: string;
  clearStatus: ClearStatusEnum;
}
