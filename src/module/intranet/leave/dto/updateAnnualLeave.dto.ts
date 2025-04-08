import { ApiProperty } from '@nestjs/swagger';

export class UpdateAnnualLeaveDto {
  @ApiProperty({ type: Number, description: '총 연차일', required: true })
  totalReceivedAnnualLeave: number;
}
