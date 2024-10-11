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
