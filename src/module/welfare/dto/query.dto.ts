import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ConfirmEnum, HalfYearEnum } from '../../../common/constant/enum';

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

export class AdminWelfareFilterDto {
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

  @ApiProperty({ name: 'userName', description: '검색 이름', example: '이승현', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ type: Number, description: '직급IDX', required: false })
  @IsOptional()
  @IsNumber()
  gradeIdx?: number;

  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '확정 여부', required: false })
  @IsOptional()
  @IsEnum(ConfirmEnum)
  confirmYN: ConfirmEnum;
}

export class AdminWelfareBudgetFilterDto {
  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분 (default: 현재 시점)', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}

export class AdminWelfareBalanceFilterDto {
  @ApiProperty({ type: String, description: '올해 년도', required: true })
  @IsNotEmpty({ message: '올해년도는 쿼리에 반드시 포함되어야합니다.' })
  @IsString()
  year: string;

  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}
