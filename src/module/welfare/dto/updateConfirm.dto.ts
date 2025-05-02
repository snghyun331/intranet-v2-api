import { ApiProperty } from '@nestjs/swagger';
import { ConfirmEnum } from '@common/constant/enum';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateConfirmDto {
  @ApiProperty({ type: Array, description: '확인할 내역 IDX 리스트', required: true })
  @IsNotEmpty()
  @IsArray()
  welfareIdxList: number[];

  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '확인여부', required: true })
  @IsNotEmpty()
  @IsEnum(ConfirmEnum)
  confirmYN: ConfirmEnum;
}
