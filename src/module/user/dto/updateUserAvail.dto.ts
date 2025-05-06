import { ApiProperty } from '@nestjs/swagger';
import { YNEnum } from '@common/constant/enum';

export class UpdateUserAvailDto {
  @ApiProperty({ type: 'enum', enum: YNEnum, required: true, description: 'Y는 재직, N는 퇴사' })
  userAvail: YNEnum;
}
