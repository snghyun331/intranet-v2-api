import { UserGradeEnum } from '../../../common/constant/enum';
import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { WelfareAdminInfo, Welfares } from '../interface/welfare.interface';
import { WelfareStats } from '../interface/welfare.interface';

export interface WelfareResult {
  welfareStats: WelfareStats;
  welfares: Welfares[];
}

export interface WelfareAdminResult extends TotalPageInfo {
  welfare: WelfareAdminInfo[];
}

export interface WelfareBudgetAdminResult {
  welfareStatsIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  welfareBudget: number;
  note: string;
}
