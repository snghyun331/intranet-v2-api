import { WithOptional } from '@common/utils/type';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';

type RequiredFields =
  | 'checkInTime'
  | 'checkOutTime'
  | 'attendance'
  | 'updateReason'
  | 'workingMinutes'
  | 'overtimeWorkingMinutes'
  | 'leaveTypeIdx';

type OptionalFields = 'leaveTypeIdx';

type UpdateCommuteTimeType = WithOptional<Pick<CommuteEntity, RequiredFields>, OptionalFields>;

export interface UpdateCommuteTimeInfo extends UpdateCommuteTimeType {}
