import { ApiProperty } from '@nestjs/swagger';
import { ConfirmEnum } from '../../../../common/constant/enum';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateConfirmDto {
  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '결제 및 승인여부' })
  @IsNotEmpty()
  @IsEnum(ConfirmEnum)
  confirmYN: ConfirmEnum;
}
