import { HalfYearEnum } from '../../../common/constant/enum';

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
  memberCount: number;
  budgetPerMember: number;
}
