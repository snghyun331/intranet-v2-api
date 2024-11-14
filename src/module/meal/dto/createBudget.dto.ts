import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMealBudgetDto {
  @ApiProperty({ type: Number, description: '기본 식대 금액', example: 10000, required: true })
  @IsNotEmpty({ message: '기본 식대 금액을 입력해주세요.' })
  @IsNumber()
  baseAmount: number;

  @ApiProperty({ type: Number, description: '인원별 총 금액', required: true })
  @IsNotEmpty({ message: '인원별 총 금액을 입력해주세요.' })
  @IsNumber()
  mealBudget: number;

  @ApiProperty({ type: String, description: '연도', example: '2024', required: true })
  @IsNotEmpty({ message: '연도를 입력해주세요.' })
  @IsString()
  year: string;

  @ApiProperty({ type: String, description: '월', example: '8', required: true })
  @IsNotEmpty({ message: '월을 입력해주세요.' })
  @IsString()
  month: string;
}
