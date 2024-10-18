import { IntersectionType, PickType } from '@nestjs/swagger';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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
  @ValidateNested({ each: true }) // each: true 옵션 => 배열에 있는 각 dto 객체도 개별적으로 유효성 검사를 하도록 설정
  @Type(() => WelfareEntity)
  welfares: WelfareEntity[];
}
