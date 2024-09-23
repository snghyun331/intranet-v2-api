import { IntersectionType, PickType } from '@nestjs/swagger';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { MealEntity } from '../../../entity/meal/meal.entity';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MealCalenderDto extends PickType(MealEntity, [
  'useDate',
  'attendance',
  'dinerName',
  'payAmount',
  'payer',
] as const) {}

export class MealStatsDto extends IntersectionType(
  PickType(MealStatsEntity, ['year', 'month', 'mealBudget', 'mealExpense', 'mealBalance'] as const),
  PickType(UserEntity, ['userName'] as const),
) {}

export class GetMealCalenderDto {
  @ValidateNested()
  @Type(() => MealStatsDto)
  mealStats: MealStatsDto;

  @IsArray()
  @ValidateNested({ each: true }) // each: true 옵션 => 배열에 있는 각 MealDto 객체도 개별적으로 유효성 검사를 하도록 설정
  @Type(() => MealCalenderDto)
  meals: MealCalenderDto[];
}

export class MealInfoDto extends PickType(MealEntity, ['mealIdx', 'userIdx', 'useDate'] as const) {}
