import { BadRequestException, Injectable } from '@nestjs/common';
import { GetMealCalenderDto, MealStatsDto } from './dto/meal.dto';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto, MealInputDto } from './dto/createMeal.dto';
import { AttendanceEnum, MealTypeEnum, YNEnum } from '../../common/constant/enum';
import { MealEntity } from '../../entity/meal/meal.entity';
import { BasicMealData, DetailedMealData } from './interface/meal.interface';
import { EntityManager } from 'typeorm';

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

      const mealData: BasicMealData = {
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

  async createMeal(userIdx: number, newMealInfo: CreateMealDto, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
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

    // 식대 등록 예외처리(연차/휴무 & 재택근무)
    if (newMealInfo.attendance === AttendanceEnum.REST || newMealInfo.attendance === AttendanceEnum.REMOTE_WORK) {
      if (
        this.isAnyFieldNull(newMealInfo.breakfast) ||
        this.isAnyFieldNull(newMealInfo.lunch) ||
        this.isAnyFieldNull(newMealInfo.dinner)
      ) {
        throw new BadRequestException('연차/휴무 및 재택 근무는 식대 지원이 불가합니다.');
      }
    }
    // 식대 등록 예외처리(오후반차)
    if (newMealInfo.attendance === AttendanceEnum.PM_HALF) {
      if (
        this.isAnyFieldNull(newMealInfo.breakfast) ||
        this.isAnyFieldNull(newMealInfo.lunch) ||
        this.isAnyFieldNull(newMealInfo.dinner)
      ) {
        throw new BadRequestException('오후 반차는 식대 지원이 불가합니다');
      }
    }
    // 식대 등록 예외처리(오전반차)
    if (newMealInfo.attendance === AttendanceEnum.AM_HALF) {
      if (this.isAnyFieldNull(newMealInfo.lunch) || this.isAnyFieldNull(newMealInfo.breakfast)) {
        throw new BadRequestException('오전 반차는 식대(조식, 중식) 지원이 불가합니다');
      }
    }

    // 중식 저장
    const newLunch: DetailedMealData = newMealInfo.lunch;
    const lunchInfo: any = await this.mealRepository.getMealIdx(userIdx, newMealInfo.targetDay, MealTypeEnum.LUNCH);
    if (newLunch.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newLunch.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newLunch.holidayYN = newMealInfo.holidayYN;
    }
    newLunch.attendance = newMealInfo.attendance;
    // 기존 정보가 있을 경우 업데이트
    if (lunchInfo) {
      await this.mealRepository.updateMeal(lunchInfo.mealIdx, newLunch, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMeal(userIdx, newMealInfo.targetDay, newLunch, MealTypeEnum.LUNCH, manager);
    }

    // 조식 저장
    const newBreakfast: DetailedMealData = newMealInfo.breakfast;
    const breakfastInfo: any = await this.mealRepository.getMealIdx(
      userIdx,
      newMealInfo.targetDay,
      MealTypeEnum.BREAKFAST,
    );
    if (newBreakfast.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newBreakfast.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newBreakfast.holidayYN = newMealInfo.holidayYN;
    }
    newBreakfast.attendance = newMealInfo.attendance;

    // 기존 정보가 있을 경우 업데이트
    if (breakfastInfo) {
      await this.mealRepository.updateMeal(breakfastInfo.mealIdx, newBreakfast, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMeal(
        userIdx,
        newMealInfo.targetDay,
        newBreakfast,
        MealTypeEnum.BREAKFAST,
        manager,
      );
    }

    // 석식 저장
    const newDinner: DetailedMealData = newMealInfo.dinner;
    const dinnerInfo: any = await this.mealRepository.getMealIdx(userIdx, newMealInfo.targetDay, MealTypeEnum.DINNER);

    if (newDinner.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newDinner.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newDinner.holidayYN = newMealInfo.holidayYN;
    }
    newDinner.attendance = newMealInfo.attendance;

    // 기존 정보가 있을 경우 업데이트
    if (dinnerInfo) {
      await this.mealRepository.updateMeal(dinnerInfo.mealIdx, newDinner, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMeal(userIdx, newMealInfo.targetDay, newDinner, MealTypeEnum.DINNER, manager);
    }

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx, manager);

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx, manager);

    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx, manager);

    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateBreakfastExpenseInStats(breakfastExpense, year, month, userIdx, manager);

    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateDinnerExpenseInStats(dinnerExpense, year, month, userIdx, manager);

    return newMealInfo.targetDay;
  }

  async deleteMeal(userIdx: number, targetDay: string, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const year: number = Number(targetDay.substring(0, 4));
    const month: number = Number(targetDay.substring(5, 7));

    await this.mealRepository.deleteMeal(userIdx, targetDay, manager);

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getTotalTimeoffDays(year, month, userIdx);
    await this.mealRepository.updateTimeOffDaysInStats(timeoffDays, year, month, userIdx, manager);
    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx, manager);
    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMealExpenseInStats(mealExpense, year, month, userIdx, manager);
    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateBreakfastExpenseInStats(breakfastExpense, year, month, userIdx, manager);
    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateDinnerExpenseInStats(dinnerExpense, year, month, userIdx, manager);
  }

  private isAnyFieldNull(mealInput: MealInputDto): boolean {
    return Object.values(mealInput).some((value) => value !== null);
  }
}
