import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ type: Date, description: '출근 시간(타임스탬프 형식, UTC 기준)', required: true })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  checkInTime: Date;
}
