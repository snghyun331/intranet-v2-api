import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { YNALLEnum } from '../../../common/constant/enum';

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

  @ApiProperty({ type: 'enum', enum: YNALLEnum, description: '재직 여부', example: 'Y', required: false })
  @IsOptional()
  @IsEnum(YNALLEnum)
  userAvail?: YNALLEnum;
}
