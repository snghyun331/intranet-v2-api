import { PickType } from '@nestjs/swagger';
import { CreateWelfareDto } from './createWelfare.dto';

export class UpdateWelfareDto extends PickType(CreateWelfareDto, [
  'targetDay',
  'amount',
  'content',
  'payerName',
  'payeeIdxs',
  'selfWrittenYN',
] as const) {}
