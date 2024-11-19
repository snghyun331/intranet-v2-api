import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { HalfYearEnum } from '../../../common/constant/enum';

export class WelfareFilterDto {
  @ApiProperty({ name: 'year', description: '검색 연도', type: String, required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ name: 'month', description: '검색 월(개별 및 복수)', type: String, required: false })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];
}

export class AdminWelfareBudgetFilterDto {
  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분 (default: 현재 시점)', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}
