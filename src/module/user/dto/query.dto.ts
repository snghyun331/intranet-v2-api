import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { GenderEnum, OrderbyEnum, SortbyEnum, YNEnum } from '../../../common/constant/enum';
import { Transform } from 'class-transformer';

export class AdminUserFilterDto {
  @ApiProperty({ type: Number, description: '직급IDX', example: 2, required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  gradeIdx?: number;

  @ApiProperty({ type: String, description: '입사일', example: '2024-05-02', required: false })
  @IsOptional()
  @IsDateString()
  joinDate?: string;

  @ApiProperty({ type: 'enum', enum: GenderEnum, description: '성별', example: 'W', required: false })
  @IsOptional()
  @IsEnum(GenderEnum)
  userGender?: YNEnum;

  @ApiProperty({ type: String, description: '성명', example: '이승현', required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({
    name: 'joinSDate',
    required: false,
    type: String,
    description: '입사일 검색 시작일자',
    example: '2024-11-01',
  })
  @IsOptional()
  @IsDateString()
  joinSDate?: string;

  @ApiProperty({
    name: 'joinEDate',
    required: false,
    type: String,
    description: '입사일 검색 종료일자',
    example: '2024-11-20',
  })
  @IsOptional()
  @IsDateString()
  joinEDate?: string;

  @ApiProperty({ type: 'enum', enum: SortbyEnum, description: '정렬 기준', required: false })
  @IsOptional()
  @IsEnum(SortbyEnum)
  sortby?: SortbyEnum;

  @ApiProperty({ type: 'enum', enum: OrderbyEnum, description: '정렬 방법', required: false })
  @IsOptional()
  @IsEnum(OrderbyEnum)
  orderby?: OrderbyEnum;
}
