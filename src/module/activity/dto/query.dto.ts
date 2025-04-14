import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HalfYearEnum } from '../../../common/constant/enum';

export class ActivityFilterDto {
  @ApiProperty({ name: 'year', description: '검색 연도', type: String, required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ name: 'halfYear', description: '검색 반기', type: 'enum', enum: HalfYearEnum, required: true })
  @IsNotEmpty()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}

export class AdminActivityFilterDto {
  @ApiProperty({
    name: 'sDate',
    required: true,
    type: String,
    description: '시작 일자',
    example: '2024-11-01',
  })
  @IsNotEmpty({ message: '날짜를 선택해주세요' })
  @IsDateString()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자',
    example: '2024-11-20',
  })
  @IsNotEmpty({ message: '날짜를 선택해주세요' })
  @IsDateString()
  eDate: string;

  @ApiProperty({ name: 'userName', description: '검색 이름', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;
}

export class AdminActivityBudgetFilterDto {
  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분 (default: 현재 시점)', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}

export class AdminActivityBalanceFilterDto {
  @ApiProperty({ type: String, description: '올해 년도', required: true })
  @IsNotEmpty({ message: '올해년도는 쿼리에 반드시 포함되어야합니다.' })
  @IsString()
  year: string;

  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}
