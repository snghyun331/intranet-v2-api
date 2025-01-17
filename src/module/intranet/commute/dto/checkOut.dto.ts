import { ApiProperty } from '@nestjs/swagger';

export class CheckOutDto {
  @ApiProperty({ type: String, description: '퇴근기기(PC, MOBILE)', required: true })
  checkOutDeviceType: string;

  @ApiProperty({ type: Date, description: '퇴근 시간(타임스탬프 형식, UTC 기준)', required: true })
  checkOutTime: Date;

  @ApiProperty({ type: String, description: '조기 퇴근 사유', required: false })
  earlyLeaveReason: string | null;
}
