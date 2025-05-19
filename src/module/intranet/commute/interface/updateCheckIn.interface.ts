import { WithOptional } from '@common/utils/type';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';

type RequiredFields =
  | 'commuteDate'
  | 'attendance'
  | 'checkInTime'
  | 'checkInIpAddr'
  | 'checkInLogAgent'
  | 'availCheckOutTime'
  | 'leaveTypeIdx';

type OptionalFields = 'leaveTypeIdx';

type UpdateCheckInType = WithOptional<Pick<CommuteEntity, RequiredFields>, OptionalFields>;

export interface UpdateCheckInInfo extends UpdateCheckInType {}
