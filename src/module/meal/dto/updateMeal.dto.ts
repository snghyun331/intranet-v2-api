import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateMealDto } from './createMeal.dto';

export class UpdateMealDto extends PartialType(OmitType(CreateMealDto, ['useDate'] as const)) {}
