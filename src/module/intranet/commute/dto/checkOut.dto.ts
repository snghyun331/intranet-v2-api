import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckOutDto {
  @ApiProperty({ type: String, description: '퇴근기기(PC, MOBILE)', required: true })
  @IsNotEmpty()
  @IsString()
  checkOutDeviceType: string;

  @ApiProperty({ type: Date, description: '퇴근 시간(타임스탬프 형식, UTC 기준)', required: true })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  checkOutTime: Date;

  @ApiProperty({ type: String, description: '조기 퇴근 사유', required: false })
  @IsOptional()
  @IsString()
  earlyLeaveReason: string | null;
}
