import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UpdateBudgetDto {
  @ApiProperty({ type: Number, description: '구성원 당 금액', required: true })
  @IsNotEmpty({ message: '구성원 당 금액은 필수입니다.' })
  @IsNumber()
  budgetPerMember: number;

  @ApiProperty({ type: Number, description: '구성원 수', required: true })
  @IsNotEmpty({ message: '구성원 수는 필수입니다.' })
  @IsNumber()
  memberCount: number;

  @ApiProperty({ type: Number, description: '추가 금액', required: true })
  @IsNotEmpty({ message: '추가 금액은 필수입니다 (없으면 0으로 입력)' })
  @IsNumber()
  extraBudget: number;

  @ApiProperty({ type: Number, description: '총 사용가능금액', required: true })
  @IsNotEmpty({ message: '총 사용가능금액은 필수입니다' })
  @IsNumber()
  activityBudget: number;
}
