import { ClearStatusEnum, ConfirmEnum, HalfYearEnum, UserGradeEnum, YNEnum } from '../../../common/constant/enum';

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
  payeeList: PayeeWelfareInfo[];
}

export interface PayeeWelfareInfo {
  userIdx: number;
  userName: string;
  amount: number;
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

export interface AdminWelfares {
  welfareIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  targetDay: string;
  content: string;
  amount: number;
  payerName: string;
  selfWrittenYN: YNEnum;
  payerWelfareIdx: number;
  confirmYN: ConfirmEnum;
  confirmDate: string;
}

export interface WelfareAdminInfo {
  welfareIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  targetDay: string;
  content: string;
  amount: number;
  payerName: string;
  payerWelfareIdx: number;
  confirmYN: ConfirmEnum;
  confirmDate: string;
  payeeList: PayeeWelfareInfo[];
}

export interface WelfareStatsAdminInfo {
  welfareStatsIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  welfareBudget: number;
  welfareExpense: number;
  welfareBalance: number;
  note: string;
  clearStatus: ClearStatusEnum;
}
