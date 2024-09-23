import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { GetMealCalenderDto, MealCalenderDto, MealInfoDto, MealStatsDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto } from './dto/createMeal.dto';
import { AttendanceEnum, YNEnum } from '../../common/constant/enum';
import { MealEntity } from '../../entity/meal/meal.entity';

@Injectable()
export class MealService {
  constructor(private readonly mealRepository: MealRepository) {}

  async getMeal(year: number, month: number, userIdx: number): Promise<GetMealCalenderDto> {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }
    const meals: MealCalenderDto[] = await this.mealRepository.getMealCalender(year, month, userIdx);
    const mealStats: MealStatsDto = await this.mealRepository.getMealStats(year, month, userIdx);
    const result: GetMealCalenderDto = { mealStats, meals };

    return result;
  }

  async createMeal(userIdx: number, mealInfo: CreateMealDto): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);

    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const year: number = Number(mealInfo.useDate.substring(0, 4));
    const month: number = Number(mealInfo.useDate.substring(5, 7));

    // 근무&휴일 (휴일근무)일 때 처리
    const monthHolidays: string[] = await this.mealRepository.getMonthHolidays(year, month);
    if (monthHolidays.includes(mealInfo.useDate)) {
      const attendance: AttendanceEnum = mealInfo.attendance;
      if (attendance !== AttendanceEnum.WORKING && attendance !== AttendanceEnum.REMOTE_WORK) {
        throw new BadRequestException('휴일에는 근무일 때만 등록할 수 있습니다.');
      }
      mealInfo.holidayYN = YNEnum.YES;
    }

    await this.mealRepository.createMeal(userIdx, mealInfo);
    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx);
    // mealExpense(사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx);
    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);
  }

  async deleteMeal(userIdx: number, mealIdx: number): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealInfo: MealInfoDto = await this.mealRepository.getMealInfoByIdx(mealIdx);
    const year: number = Number(mealInfo.useDate.substring(0, 4));
    const month: number = Number(mealInfo.useDate.substring(5, 7));

    if (userIdx !== mealInfo.userIdx) {
      throw new ForbiddenException('식대 삭제 권한이 없습니다');
    }

    await this.mealRepository.deleteMeal(mealIdx);
    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx);
    // mealExpense(사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx);
    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);
  }

  async getMealDetail(userIdx: number, mealIdx: number): Promise<MealEntity> {
    const userCnt: number = await this.mealRepository.getUserCount(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealEntity: MealEntity = await this.mealRepository.getMealDetail(mealIdx);
    if (userIdx !== mealEntity.userIdx) {
      throw new ForbiddenException('식대 조회 권한이 없습니다');
    }

    return mealEntity;
  }
}
