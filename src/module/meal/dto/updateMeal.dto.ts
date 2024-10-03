import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMealDto } from './createMeal.dto';
import { IsEmpty } from 'class-validator';

export class UpdateMealDto extends PartialType(OmitType(CreateMealDto, ['useDate', 'mealType'] as const)) {
  @IsEmpty({ message: 'mealType은 수정할 수 없습니다.' })
  mealType?: never;

  @IsEmpty({ message: 'useDate는 수정할 수 없습니다.' })
  useDate?: never;
}
