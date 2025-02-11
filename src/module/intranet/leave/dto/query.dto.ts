import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { GenderEnum, OrderbyEnum, SortbyEnum } from '../../../../common/constant/enum';

export class AdminLeaveFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '회계연도', type: String, example: '2025' })
  year: string;

  @ApiProperty({ type: Number, description: '직급IDX', required: false })
  @IsOptional()
  @IsNumber()
  gradeIdx?: number;

  @ApiProperty({
    name: 'joinSDate',
    required: false,
    type: String,
    description: '입사일 검색 시작일자',
  })
  @IsOptional()
  @IsDateString()
  joinSDate?: string;

  @ApiProperty({
    name: 'joinEDate',
    required: false,
    type: String,
    description: '입사일 검색 종료일자',
  })
  @IsOptional()
  @IsDateString()
  joinEDate?: string;

  @ApiProperty({ type: 'enum', enum: GenderEnum, description: '성별', example: 'W', required: false })
  @IsOptional()
  @IsEnum(GenderEnum)
  userGender?: GenderEnum;

  @ApiProperty({ name: 'userName', description: '검색 이름', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ type: 'enum', enum: SortbyEnum, description: '정렬 기준', required: false })
  @IsOptional()
  @IsEnum(SortbyEnum)
  sortby?: SortbyEnum;

  @ApiProperty({ type: 'enum', enum: OrderbyEnum, description: '정렬 방법', required: false })
  @IsOptional()
  @IsEnum(OrderbyEnum)
  orderby?: OrderbyEnum;
}
