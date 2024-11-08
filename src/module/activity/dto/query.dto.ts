import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class ActivityFilterDto {
  @ApiProperty({ name: 'year', description: '검색 연도', type: String, required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ name: 'month', description: '검색 월(개별 및 복수)', type: String, required: false })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];
}
