import { ApiProperty } from '@nestjs/swagger';
import { ConfirmEnum } from '../../../common/constant/enum';

export class UpdateConfirmDto {
  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '확인여부', required: true })
  confirmYN: ConfirmEnum;
}
