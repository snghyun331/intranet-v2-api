import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateWelfareDto } from './createWelfare.dto';
import { IsEmpty } from 'class-validator';

export class UpdateWelfareDto extends PartialType(OmitType(CreateWelfareDto, ['useDate'] as const)) {
  @IsEmpty({ message: 'useDate는 수정할 수 없습니다.' })
  useDate?: never;
}
