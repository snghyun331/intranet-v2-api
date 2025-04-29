import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMealBudgetDto {
  @ApiProperty({ type: Number, description: '기본 식대 금액', example: 10000, required: true })
  @IsNotEmpty({ message: '기본 식대 금액을 입력해주세요.' })
  @IsNumber()
  baseAmount: number;

  @ApiProperty({ type: Number, description: '업무일', example: 21, required: true })
  @IsNotEmpty({ message: '업무일을 입력해주세요' })
  @IsNumber()
  workdays: number;

  @ApiProperty({ type: String, description: '연도', example: '2024', required: true })
  @IsNotEmpty({ message: '연도를 입력해주세요.' })
  @IsString()
  year: string;

  @ApiProperty({ type: String, description: '월(한자리수)', example: '8', required: true })
  @IsNotEmpty({ message: '월을 입력해주세요.' })
  @IsString()
  month: string;
}
