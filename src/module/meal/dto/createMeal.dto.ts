import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { AttendanceEnum, MealTypeEnum, YNEnum } from '../../../common/constant/enum';

export class CreateMealDto {
  @ApiProperty({ type: String, description: '식대 사용일', required: true })
  @IsNotEmpty({ message: '날짜는 필수로 입력해주세요.' })
  @IsString()
  useDate: string;

  @ApiProperty({
    type: Object.values(AttendanceEnum),
    enum: AttendanceEnum,
    description: '근태(근무, 재택 근무, 연차, 휴무, 오전 반차, 오후 반차)',
    required: true,
  })
  @IsNotEmpty({ message: '근무형태는 필수로 입력해주세요.' })
  @IsEnum(AttendanceEnum)
  attendance: AttendanceEnum;

  @ApiProperty({
    type: Object.values(MealTypeEnum),
    enum: MealTypeEnum,
    description: '조식 중식 석식 여부',
    required: false,
  })
  @IsOptional()
  @IsEnum(MealTypeEnum)
  mealType?: MealTypeEnum;

  @ApiProperty({ type: String, description: '식당 상호명', required: false })
  @IsOptional()
  @IsString()
  dinerName?: string;

  @ApiProperty({ type: Number, description: '결제 금액', required: false })
  @IsOptional()
  @IsNumber()
  payAmount?: number;

  @ApiProperty({ type: String, description: '결제자(이름만 넣어주세요)', required: false })
  @IsOptional()
  @IsString()
  payer?: string;

  @IsOptional()
  @IsEnum(YNEnum)
  holidayYN?: YNEnum;
}
