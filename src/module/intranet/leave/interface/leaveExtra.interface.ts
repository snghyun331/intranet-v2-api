import { LeaveExtraEntity } from '../../../../entity/intranet/leave/leaveExtra.entity';

type RequiredFields = 'userIdx' | 'year' | 'leaveTypeIdx' | 'extraLeave' | 'adminName' | 'note';
type NewLeaveExtraType = Pick<LeaveExtraEntity, RequiredFields>;

export interface NewLeaveExtra extends NewLeaveExtraType {}
