import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMonthlyBaverageDto {
  @ApiProperty({ name: 'month', required: true, type: String, example: '6' })
  @IsNotEmpty({ message: '월을 입력해주세요' })
  @IsString()
  month: string;

  @ApiProperty({ name: 'pickup', required: false, type: Array, example: ['이승현', '김현민'] })
  @IsOptional()
  pickup: string[];

  @ApiProperty({ name: 'dueDate', required: true, type: String, example: '2025-05-22' })
  @IsNotEmpty({ message: '마감일을 입력해주세요' })
  @IsString()
  dueDate: string;
}
