import { UserGradeEnum } from '../../../common/constant/enum';
import { Activities, ActivityStats } from './activity.interface';

export interface ActivityResult {
  activityStats: ActivityStats;
  activities: Activities[];
}

export interface ActivityBudgetAdminResult {
  activityStatsIdx: number;
  userIdx: number;
  userName: string;
  gradeName: UserGradeEnum;
  activityBudget: number;
  note: string;
  memberCount: number;
  budgetPerMember: number;
  extraBudget: number;
}
