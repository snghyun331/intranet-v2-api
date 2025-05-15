import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBudgetDto {
  @ApiProperty({ type: Number, description: '식대 총금액', required: true })
  @IsNotEmpty()
  @IsNumber()
  mealBudget: number;
}
