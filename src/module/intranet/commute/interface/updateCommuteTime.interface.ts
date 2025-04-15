import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';

type RequiredFields =
  | 'checkInTime'
  | 'checkOutTime'
  | 'attendance'
  | 'updateReason'
  | 'workingMinutes'
  | 'overtimeWorkingMinutes';

type UpdateCommuteTimeType = Pick<CommuteEntity, RequiredFields>;

export interface UpdateCommuteTimeInfo extends UpdateCommuteTimeType {}
