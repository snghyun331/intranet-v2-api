import { ConfirmEnum, YNEnum } from '../../../common/constant/enum';

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
  welfareBudget: number;
  welfareExpense: number;
  welfareBalance: number;
  userName: string;
}
