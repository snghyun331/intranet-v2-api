import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AttendanceEnum, YNEnum } from '../../../common/constant/enum';
import { Type } from 'class-transformer';

export class MealInputDto {
  @ApiProperty({ type: String, description: '결제자(이름만 넣어주세요)', required: true })
  @IsString()
  payerName: string;

  @ApiProperty({ type: String, description: '식당 상호명', required: true })
  @IsString()
  place: string;

  @ApiProperty({ type: Number, description: '결제 금액', required: false })
  @IsOptional()
  amount: number | null;
}

export class CreateMealDto {
  @ApiProperty({ type: String, description: '식대 사용일', required: true })
  @IsNotEmpty({ message: '날짜는 필수로 입력해주세요.' })
  @IsString()
  targetDay: string;

  @ApiProperty({
    type: Object.values(AttendanceEnum),
    enum: AttendanceEnum,
    description: '근태(근무, 재택 근무, 연차, 휴무, 오전 반차, 오후 반차)',
    required: true,
  })
  @IsNotEmpty({ message: '근무형태는 필수로 입력해주세요.' })
  @IsEnum(AttendanceEnum)
  attendance: AttendanceEnum;

  @ApiProperty({ type: MealInputDto, description: '조식 정보' })
  @ValidateNested()
  @Type(() => MealInputDto)
  breakfast: MealInputDto;

  @ApiProperty({ type: MealInputDto, description: '중식 정보' })
  @ValidateNested()
  @Type(() => MealInputDto)
  lunch: MealInputDto;

  @ApiProperty({ type: MealInputDto, description: '석식 정보' })
  @ValidateNested()
  @Type(() => MealInputDto)
  dinner: MealInputDto;

  @IsOptional()
  @IsEnum(YNEnum)
  holidayYN?: YNEnum;
}
