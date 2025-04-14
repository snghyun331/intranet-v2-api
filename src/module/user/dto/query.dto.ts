import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { OrderbyEnum, SortbyEnum } from '../../../common/constant/enum';
import { Transform } from 'class-transformer';

export class AdminUserFilterDto {
  @ApiProperty({ type: Number, description: '직급IDX', example: 2, required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  gradeIdx?: number;

  @ApiProperty({ type: String, description: '성명', example: '이승현', required: false })
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
