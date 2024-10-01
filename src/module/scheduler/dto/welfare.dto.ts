import { PickType } from '@nestjs/swagger';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';

export class NewWelfareStatsDto extends PickType(WelfareStatsEntity, [
  'userIdx',
  'year',
  'halfYear',
  'welfareBudget',
] as const) {}
