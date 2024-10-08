import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { GetMealCalenderDto, MealInfoDto, MealStatsDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto } from './dto/createMeal.dto';
import { AttendanceEnum, MealTypeEnum, YNEnum } from '../../common/constant/enum';
import { MealEntity } from '../../entity/meal/meal.entity';
import { UpdateMealDto } from './dto/updateMeal.dto';
import { MealDataInterface } from './interface/meal.interface';

@Injectable()
export class MealService {
  constructor(private readonly mealRepository: MealRepository) {}

  async getMeal(year: number, month: number, userIdx: number): Promise<GetMealCalenderDto> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealInfo: MealEntity[] = await this.mealRepository.getMealCalender(year, month, userIdx);
    const mealStats: MealStatsDto = await this.mealRepository.getMealStats(year, month, userIdx);

    // 날짜별로 그룹화하여 meals를 구성
    const meals: any[] = mealInfo.reduce((acc, meal) => {
      const existingDate = acc.find((m) => m.start === meal.targetDay);

      const mealData: MealDataInterface = {
        payerName: meal.payerName || null,
        place: meal.place || null,
        amount: meal.amount || null,
      };
      if (meal.mealType === MealTypeEnum.LUNCH && meal.attendance) {
        mealData.attendance = meal.attendance; // attendance가 있을 때만 추가
      } else if (meal.mealType === MealTypeEnum.LUNCH && !meal.attendance) {
        mealData.attendance = null;
      }

      if (existingDate) {
        // mealType에 따라 해당 식사 시간에 데이터를 할당
        switch (meal.mealType) {
          case MealTypeEnum.BREAKFAST:
            existingDate.breakfast = mealData;
            break;
          case MealTypeEnum.LUNCH:
            existingDate.lunch = mealData;
            break;
          case MealTypeEnum.DINNER:
            existingDate.dinner = mealData;
            break;
          default:
            break;
        }
      } else {
        // 새로운 날짜에 대한 식사 정보를 추가
        acc.push({
          start: meal.targetDay,
          holidayYN: meal.holidayYN,
          breakfast:
            meal.mealType === MealTypeEnum.BREAKFAST ? mealData : { payerName: null, place: null, amount: null },
          lunch:
            meal.mealType === MealTypeEnum.LUNCH
              ? mealData
              : { payerName: null, place: null, amount: null, attendance: null },
          dinner: meal.mealType === MealTypeEnum.DINNER ? mealData : { payerName: null, place: null, amount: null },
        });
      }

      return acc;
    }, []);

    const result: GetMealCalenderDto = {
      mealStats,
      meals,
    };

    return result;
  }

  async createMeal(userIdx: number, newMealInfo: CreateMealDto): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);

    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    if (newMealInfo.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newMealInfo.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }

    const year: number = Number(newMealInfo.targetDay.substring(0, 4));
    const month: number = Number(newMealInfo.targetDay.substring(5, 7));

    // 근무&휴일 (휴일근무)일 때 처리
    const monthHolidays: string[] = await this.mealRepository.getMonthHolidays(year, month);
    if (monthHolidays.includes(newMealInfo.targetDay)) {
      const attendance: AttendanceEnum = newMealInfo.attendance;
      if (attendance !== AttendanceEnum.WORKING) {
        throw new BadRequestException('휴일에는 근무일 때만 등록할 수 있습니다.');
      }
      newMealInfo.holidayYN = YNEnum.YES;
    }

    await this.mealRepository.createMeal(userIdx, newMealInfo);

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx);

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);

    if (newMealInfo.mealType === MealTypeEnum.LUNCH) {
      // mealExpense(중식 사용금액) 업데이트
      const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
      await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx);
    }
    if (newMealInfo.mealType === MealTypeEnum.BREAKFAST) {
      // breakExpense(조식 사용금액) 업데이트
      const breakfastExpense: number = await this.mealRepository.getTotalBreakfastExpense(year, month, userIdx);
      await this.mealRepository.updateBreakfastExpenseInStats(breakfastExpense, year, month, userIdx);
    }
    if (newMealInfo.mealType === MealTypeEnum.DINNER) {
      // dinnerExpense(조식 사용금액) 업데이트
      const dinnerExpense: number = await this.mealRepository.getTotalDinnerExpense(year, month, userIdx);
      await this.mealRepository.updateDinnerExpenseInStats(dinnerExpense, year, month, userIdx);
    }
  }

  async deleteMeal(userIdx: number, mealIdx: number): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealInfo: MealInfoDto = await this.mealRepository.getMealInfoByIdx(mealIdx);
    const year: number = Number(mealInfo.targetDay.substring(0, 4));
    const month: number = Number(mealInfo.targetDay.substring(5, 7));

    if (userIdx !== mealInfo.userIdx) {
      throw new ForbiddenException('식대 삭제 권한이 없습니다');
    }

    await this.mealRepository.deleteMeal(mealIdx);

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx);
    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);
    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx);
    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateBreakfastExpenseInStats(breakfastExpense, year, month, userIdx);
    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateDinnerExpenseInStats(dinnerExpense, year, month, userIdx);
  }

  async updateMeal(userIdx: number, mealIdx: number, updateMealInfo: UpdateMealDto): Promise<string> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    if (updateMealInfo.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(updateMealInfo.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }

    const mealInfo: MealInfoDto = await this.mealRepository.getMealInfoByIdx(mealIdx);
    if (!mealInfo) {
      throw new NotFoundException('해당 식대는 존재하지 않거나 삭제되었습니다.');
    }
    const year: number = Number(mealInfo.targetDay.substring(0, 4));
    const month: number = Number(mealInfo.targetDay.substring(5, 7));

    if (userIdx !== mealInfo.userIdx) {
      throw new ForbiddenException('식대 수정 권한이 없습니다');
    }

    if (updateMealInfo.attendance) {
      // 근무&휴일 (휴일근무)일 때 처리
      const monthHolidays: string[] = await this.mealRepository.getMonthHolidays(year, month);
      if (monthHolidays.includes(mealInfo.targetDay)) {
        const attendance: AttendanceEnum = updateMealInfo.attendance;
        if (attendance !== AttendanceEnum.WORKING) {
          throw new BadRequestException('휴일에는 근무일 때만 등록할 수 있습니다.');
        }
        updateMealInfo.holidayYN = YNEnum.YES;
      }
    }

    await this.mealRepository.updateMeal(mealIdx, updateMealInfo);

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx);
    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);
    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx);
    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateBreakfastExpenseInStats(breakfastExpense, year, month, userIdx);
    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateDinnerExpenseInStats(dinnerExpense, year, month, userIdx);

    return mealInfo.targetDay;
  }
}
