import { Welfares } from '../interface/welfare.interface';
import { WelfareStats } from '../interface/welfare.interface';

export interface WelfareResult {
  welfareStats: WelfareStats;
  welfares: Welfares[];
}
