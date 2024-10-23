import { HalfYearEnum } from '../../../common/constant/enum';

export interface NewWelfareStats {
  userIdx: number;
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
