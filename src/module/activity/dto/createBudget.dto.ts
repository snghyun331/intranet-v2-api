import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { HalfYearEnum } from '../../../common/constant/enum';

export class CreateActivityBudgetDto {
  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '적용 기간', required: true })
  @IsNotEmpty({ message: '적용 기간을 선택해주세요' })
  @IsEnum(HalfYearEnum)
  period: HalfYearEnum;

  @ApiProperty({ type: String, description: '활동비 권한자IDX', required: true })
  @IsNotEmpty({ message: '이름(IDX)을 선택해주세요' })
  @IsNumber()
  userIdx: number;

  @ApiProperty({ type: Number, description: '구성원 수', required: true })
  @IsNotEmpty({ message: '구성원 수를 입력해주세요' })
  @IsNumber()
  memberCount: number;

  @ApiProperty({ type: Number, description: '구성원 당 금액', required: true })
  @IsNotEmpty({ message: '구성원 당 금액을 입력해주세요' })
  @IsNumber()
  budgetPerMember: number;

  @ApiProperty({ type: Number, description: '활동비 사용가능금액', required: true })
  @IsNotEmpty({ message: '사용가능금액을 입력해주세요.' })
  @IsNumber()
  activityBudget: number;
}
