import { Activities, ActivityStats } from './activity.interface';

export interface ActivityResult {
  activityStats: ActivityStats;
  activities: Activities[];
}
