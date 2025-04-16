import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';
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
}
