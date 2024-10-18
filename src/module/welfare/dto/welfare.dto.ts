import { IntersectionType, PickType } from '@nestjs/swagger';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Welfares } from '../interface/welfare.interface';

export class WelfareInfoDto extends PickType(WelfareEntity, ['welfareIdx', 'userIdx', 'targetDay'] as const) {}

export class WelfareStatsDto extends IntersectionType(
  PickType(WelfareStatsEntity, ['year', 'welfareBudget', 'welfareExpense', 'welfareBalance'] as const),
  PickType(UserEntity, ['userName'] as const),
) {}

export class GetWelfareDto {
  @ValidateNested()
  @Type(() => WelfareStatsDto)
  welfareStats: WelfareStatsDto;

  @IsArray()
  welfares: Welfares[];
}
