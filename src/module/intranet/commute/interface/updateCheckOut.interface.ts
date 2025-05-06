import { CommuteEntity } from '@entity/intranet/commute/commute.entity';

type RequiredFields =
  | 'commuteDate'
  | 'attendance'
  | 'checkOutTime'
  | 'checkOutIpAddr'
  | 'checkOutLogAgent'
  | 'earlyLeaveReason'
  | 'workingMinutes'
  | 'overtimeWorkingMinutes';

type UpdateCheckOutType = Pick<CommuteEntity, RequiredFields>;

export interface UpdateCheckOutInfo extends UpdateCheckOutType {}
