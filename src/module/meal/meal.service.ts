import { BadRequestException, Injectable } from '@nestjs/common';
import { GetMealDto, MealDto, MealStatsDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto } from './dto/createMeal.dto';

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

  async createMeal(userIdx: number, mealInfo: CreateMealDto) {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }
    await this.mealRepository.createMeal(userIdx, mealInfo);

    /* 근무&휴일 (휴일근무)일 때 */
    // 이번달 휴일 날짜 가져오기 (주말, 공휴일)
    const monthHolidays: string[] = await this.mealRepository.getMonthHolidays();
    if (monthHolidays.includes(mealInfo.useDate)) {
      // 식태 통계에서 휴일근무수(Holidayworkdays) 1증가
    }
  }
}
