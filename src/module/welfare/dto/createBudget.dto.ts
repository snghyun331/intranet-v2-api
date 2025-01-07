import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { HalfYearEnum } from '../../../common/constant/enum';

export class CreateWelfareBudgetDto {
  @ApiProperty({ type: String, description: '적용 년도', required: true })
  @IsNotEmpty({ message: '적용 년도를 선택해주세요' })
  @IsString()
  year: string;

  @ApiProperty({ type: 'enum', enum: HalfYearEnum, description: '적용 기간', required: true })
  @IsNotEmpty({ message: '적용 기간을 선택해주세요' })
  @IsEnum(HalfYearEnum)
  period: HalfYearEnum;

  @ApiProperty({ type: Number, description: '인원별 총 금액', required: true })
  @IsNotEmpty({ message: '인원별 총 금액을 입력d해주세요.' })
  @IsNumber()
  welfareBudget: number;
}
