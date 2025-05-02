import { CommuteEntity } from '@entity/intranet/commute/commute.entity';

type RequiredFields =
  | 'commuteDate'
  | 'attendance'
  | 'checkInTime'
  | 'checkInIpAddr'
  | 'checkInLogAgent'
  | 'leaveTypeIdx';

type InsertCheckInType = Pick<CommuteEntity, RequiredFields>;

export interface InsertCheckInInfo extends InsertCheckInType {}
