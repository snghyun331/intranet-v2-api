import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ConfirmEnum } from '../enum/welfare.enum';

export class UpdateConfirmDto {
  @ApiProperty({ type: Array, description: '확인할 내역 IDX 리스트', required: true })
  @IsNotEmpty()
  @IsArray()
  welfareIdxList: number[];

  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '확정여부', required: true })
  @IsNotEmpty()
  @IsEnum(ConfirmEnum)
  confirmYN: ConfirmEnum;
}
