import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBudgetDto {
  @ApiProperty({ type: Number, description: '총 사용가능금액', required: true })
  @IsNotEmpty({ message: '총 사용가능금액은 필수입니다' })
  @IsNumber()
  activityBudget: number;
}
