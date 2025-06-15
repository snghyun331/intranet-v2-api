import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCommuteTimeDto {
  @ApiProperty({ type: Date, description: '출근 시간(타임스탬프 형식, UTC 기준)', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkInTime: Date;

  @ApiProperty({ type: Date, description: '퇴근 시간(타임스탬프 형식, UTC 기준)', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  checkOutTime: Date;

  @ApiProperty({ type: String, description: '시간 수정 사유 (필수 입력)', required: true })
  @IsNotEmpty()
  @IsString()
  updateReason: string;
}
