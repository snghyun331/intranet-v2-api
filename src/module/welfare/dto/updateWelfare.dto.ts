import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWelfareDto } from './createWelfare.dto';
import { IsEmpty } from 'class-validator';

export class UpdateWelfareDto extends PartialType(OmitType(CreateWelfareDto, ['targetDay'] as const)) {
  @IsEmpty({ message: 'targetDay는 수정할 수 없습니다.' })
  targetDay?: never;
}
