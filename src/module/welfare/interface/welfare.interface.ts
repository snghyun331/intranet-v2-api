import { ConfirmEnum, HalfYearEnum, YNEnum } from '../../../common/constant/enum';

export interface WelfareInfo {
  welfareIdx: number;
  userIdx: number;
  targetDay: string;
}

export interface Welfares extends WelfareInfo {
  content: string;
  amount: number;
  payerName: string;
  selfWrittenYN: YNEnum;
  confirmYN: ConfirmEnum;
  payeeList: UserInfo[];
}

export interface UserInfo {
  userIdx: number;
  userName: string;
}

export interface WelfareStats {
  year: string;
  halfYear: HalfYearEnum;
  welfareBudget: number;
  welfareExpense: number;
  welfareBalance: number;
  userName: string;
}

export interface NewWelfareStats {
  userIdx?: number;
  year: string;
  halfYear: HalfYearEnum;
  welfareBudget: number;
}

export interface NewWelfareMonthStats {
  userIdx: number;
  year: string;
  month: string;
  welfareMonthExpense: number;
}
