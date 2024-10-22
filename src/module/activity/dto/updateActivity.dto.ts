import { PickType } from '@nestjs/swagger';
import { CreateActivityDto } from './createActivity.dto';

export class UpdateActivityDto extends PickType(CreateActivityDto, [
  'targetDay',
  'amount',
  'content',
  'payerName',
] as const) {}
