import { BadRequestException, Injectable } from '@nestjs/common';
import { GetMealDto, MealDto, MealStatsDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';

@Injectable()
export class MealService {
  constructor(private readonly mealRepository: MealRepository) {}

  async getMeal(year: number, month: number, userIdx: number): Promise<GetMealDto> {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }
    const meals: MealDto[] = await this.mealRepository.getMeal(year, month, userIdx);
    const mealStats: MealStatsDto = await this.mealRepository.getMealStats(year, month, userIdx);
    const result: GetMealDto = { mealStats, meals };

    return result;
  }
}
