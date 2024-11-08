import { ConfirmEnum, HalfYearEnum } from '../../../common/constant/enum';

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
