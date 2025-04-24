import { ApiProperty } from '@nestjs/swagger';

export class UpdateExtraLeaveDto {
  @ApiProperty({ type: Number, description: '직원 IDX', required: true })
  userIdx: number;

  @ApiProperty({ type: String, description: '연도', required: true })
  year: string;

  @ApiProperty({ type: Number, description: '휴가유형IDX', required: true })
  leaveTypeIdx: number;

  @ApiProperty({ type: Number, description: '부여개수', required: true })
  extraLeave: number;
}
