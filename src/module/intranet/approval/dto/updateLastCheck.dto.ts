import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class UpdateLastCheckTimeDto {
  @ApiProperty({ name: 'lastCheckedAt', description: '확인 시간(UTC 타임스탬프)', required: true })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  lastCheckedAt: Date;

  @ApiProperty({ name: 'relationType', description: '참조/승인 구분', required: true })
  @IsNotEmpty()
  @IsString()
  relationType: string;
}
