import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ConfirmEnum } from '../../../common/constant/enum';

export class ActivityFilterDto {
  @ApiProperty({ name: 'year', description: '검색 연도', type: String, required: false })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiProperty({ name: 'month', description: '검색 월(개별 및 복수)', example: '10,11', type: String, required: false })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];
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

  @ApiProperty({ name: 'userName', description: '검색 이름', example: '김현근', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ type: 'enum', enum: ConfirmEnum, description: '확정 여부', required: false })
  @IsOptional()
  @IsEnum(ConfirmEnum)
  confirmYN: ConfirmEnum;
}
