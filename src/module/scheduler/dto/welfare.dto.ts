import { PickType } from '@nestjs/swagger';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';

export class NewWelfareStatsDto extends PickType(WelfareStatsEntity, [
  'userIdx',
  'year',
  'halfYear',
  'welfareBudget',
] as const) {}

export class NewWelfareMonthStatsDto extends PickType(WelfareMonthlyStatsEntity, [
  'userIdx',
  'year',
  'month',
  'welfareMonthExpense',
] as const) {}
