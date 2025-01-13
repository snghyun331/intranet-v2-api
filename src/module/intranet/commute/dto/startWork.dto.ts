import { ApiProperty } from '@nestjs/swagger';

export class StartWorkDto {
  @ApiProperty({ type: String, description: '출근기기(PC, MOBILE)', required: true })
  checkInDeviceType: string;

  @ApiProperty({ type: String, description: '출근 날짜(0000-00-00 KST 기준)', required: true })
  commuteDate: string;

  @ApiProperty({ type: Date, description: '출근 시간(타임스탬프 형식, UTC 기준)', required: true })
  checkInTime: Date;
}
