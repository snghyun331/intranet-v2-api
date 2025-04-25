import { PickType } from '@nestjs/swagger';
import { CreateExtraLeaveDto } from './createExtraLeave.dto';

export class UpdateExtraLeaveDto extends PickType(CreateExtraLeaveDto, [
  'userIdx',
  'year',
  'leaveTypeIdx',
  'extraLeave',
  'note',
] as const) {}
