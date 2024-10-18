import { YNEnum } from '../../../common/constant/enum';

export interface Welfares {
  welfareIdx: number;
  userIdx: number;
  targetDay: string;
  content: string;
  amount: number;
  payerName: string;
  selfWrittenYN: YNEnum;
  payeeList: UserInfo[];
}

export interface UserInfo {
  userIdx: number;
  userName: string;
}
