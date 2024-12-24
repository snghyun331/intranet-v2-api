import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBudgetDto {
  @ApiProperty({ type: Number, description: '수정할 총 사용가능금액', required: true })
  @IsNotEmpty({ message: '금액을 입력해주세요' })
  @IsNumber()
  activityBudget: number;
}
