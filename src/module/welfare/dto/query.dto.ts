import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HalfYearEnum } from '@common/constant/enum';
import { ConfirmEnum } from '../enum/welfare.enum';
import { Transform } from 'class-transformer';

export class WelfareFilterDto {
  @ApiProperty({ name: 'year', description: '검색 연도', type: String, required: true })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({ name: 'halfYear', description: '검색 반기', type: 'enum', enum: HalfYearEnum, required: true })
  @IsNotEmpty()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
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

  @ApiProperty({ name: 'content', description: '사용처', example: '버거킹', type: String, required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ name: 'userIdxs', required: false, description: '사용자IDX(개별 및 복수)', type: String })
  @IsOptional()
  @Transform(({ value }) =>
    decodeURIComponent(value)
      .split(',')
      .map((item) => Number(item.trim())),
  ) // 쉼표로 구분된 문자열을 배열로 변환
  userIdxs?: number[];

  @ApiProperty({ name: 'payerIdxs', type: String, description: '결제자IDX(개별 및 복수)', required: false })
  @IsOptional()
  @Transform(({ value }) =>
    decodeURIComponent(value)
      .split(',')
      .map((item) => Number(item.trim())),
  ) // 쉼표로 구분된 문자열을 배열로 변환
  payerIdxs?: number[];

  @ApiProperty({ name: 'confirmYN', description: '확정 구분', type: 'enum', enum: ConfirmEnum, required: false })
  @IsOptional()
  @IsEnum(ConfirmEnum)
  confirmYN?: ConfirmEnum;
}

export class AdminWelfareBudgetFilterDto {
  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분 (default: 현재 시점)', required: false })
  @IsOptional()
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}

export class AdminWelfareBalanceFilterDto {
  @ApiProperty({ type: String, description: '올해 년도', required: true })
  @IsNotEmpty({ message: '올해년도 입력은 필수입니다.' })
  @IsString()
  year: string;

  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '상하반기 구분', required: true })
  @IsNotEmpty({ message: '상하반기 입력은 필수입니다.' })
  @IsEnum(HalfYearEnum)
  halfYear: HalfYearEnum;
}
