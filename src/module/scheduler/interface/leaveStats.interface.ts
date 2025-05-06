import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';

type RequiredFields = 'totalReceivedAnnualLeave' | 'totalAnnualLeaveUsage' | 'midJoinReceivedAnnualLeave';
type NewLeaveStatsType = Pick<LeaveStatsEntity, RequiredFields>;

export interface NewLeaveStats extends NewLeaveStatsType {}
