import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto } from './dto/createMeal.dto';
import { MealTypeEnum, YNEnum } from '../../common/constant/enum';
import { BasicMealData, DetailedMealData } from './interface/meal.interface';
import { AdminMealBalanceFilterDto, AdminMealBudgetFilterDto, AdminMealFilterDto } from './dto/query.dto';
import { CreateMealBudgetDto } from './dto/createBudget.dto';
import { getTotalDaysInMonth, substringYearMonth } from '../../common/utils/utility';
import { NewMealStats } from '../scheduler/interface/meal.interface';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_DINNER_RATE } from '../../common/constant/constant';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class MealService {
  constructor(private readonly mealRepository: MealRepository) {}

  async getMyMeal(year: string, month: string, userIdx: number) {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealInfo = await this.mealRepository.getMyMealCalender(year, month, userIdx);
    const mealStats = await this.mealRepository.getMyMealStats(year, month, userIdx);

    // 날짜별로 그룹화하여 meals를 구성
    const meals: any[] = mealInfo.reduce((acc, meal) => {
      const existingDate = acc.find((m) => m.start === meal.targetDay);

      const mealData: BasicMealData = {
        payerName: meal.payerName,
        place: meal.place,
        amount: meal.amount,
      };

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
          breakfast: meal.mealType === MealTypeEnum.BREAKFAST ? mealData : { payerName: '', place: '', amount: null },
          lunch: meal.mealType === MealTypeEnum.LUNCH ? mealData : { payerName: '', place: '', amount: null },
          dinner: meal.mealType === MealTypeEnum.DINNER ? mealData : { payerName: '', place: '', amount: null },
        });
      }

      return acc;
    }, []);

    const result = { mealStats, meals };

    return result;
  }

  @Transactional()
  async createMyMeal(userIdx: number, newMealInfo: CreateMealDto): Promise<string> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { year, month } = substringYearMonth(newMealInfo.targetDay);

    // 아직 해당 월에 대한 meal_stats가 등록되지 않았다면 등록 불가 처리
    const mealStats = await this.mealRepository.getMyMealStats(year, month, userIdx);
    if (!mealStats) {
      throw new BadRequestException('어드민에서 아직 사용가능금액 등록을 하지 않아, 식대 저장이 불가합니다.');
    }

    // 근무&휴일 (휴일근무)일 때 처리
    const monthHolidays: string[] = await this.mealRepository.getMonthHolidays(year, month);
    if (monthHolidays.includes(newMealInfo.targetDay)) {
      newMealInfo.holidayYN = YNEnum.YES;
    }

    // 중식 저장
    const newLunch: DetailedMealData = newMealInfo.lunch;
    const lunchInfo = await this.mealRepository.getMealIdx(userIdx, newMealInfo.targetDay, MealTypeEnum.LUNCH);
    if (newLunch.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newLunch.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newLunch.holidayYN = newMealInfo.holidayYN;
    }

    // 기존 정보가 있을 경우 업데이트
    if (lunchInfo) {
      await this.mealRepository.updateMyMeal(lunchInfo.mealIdx, newLunch);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(userIdx, newMealInfo.targetDay, newLunch, MealTypeEnum.LUNCH);
    }

    // 조식 저장
    const newBreakfast: DetailedMealData = newMealInfo.breakfast;
    const breakfastInfo = await this.mealRepository.getMealIdx(userIdx, newMealInfo.targetDay, MealTypeEnum.BREAKFAST);
    if (newBreakfast.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newBreakfast.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newBreakfast.holidayYN = newMealInfo.holidayYN;
    }

    // 기존 정보가 있을 경우 업데이트
    if (breakfastInfo) {
      await this.mealRepository.updateMyMeal(breakfastInfo.mealIdx, newBreakfast);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(userIdx, newMealInfo.targetDay, newBreakfast, MealTypeEnum.BREAKFAST);
    }

    // 석식 저장
    const newDinner: DetailedMealData = newMealInfo.dinner;
    const dinnerInfo = await this.mealRepository.getMealIdx(userIdx, newMealInfo.targetDay, MealTypeEnum.DINNER);

    if (newDinner.payerName) {
      const allUserNames: string[] = await this.mealRepository.getAllUserNames();
      if (!allUserNames.includes(newDinner.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }
    if (newMealInfo.holidayYN) {
      newDinner.holidayYN = newMealInfo.holidayYN;
    }

    // 기존 정보가 있을 경우 업데이트
    if (dinnerInfo) {
      await this.mealRepository.updateMyMeal(dinnerInfo.mealIdx, newDinner);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(userIdx, newMealInfo.targetDay, newDinner, MealTypeEnum.DINNER);
    }

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getMyTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateMyHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);

    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getMyTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMyMealExpenseInStats(mealExpense, year, month, userIdx);

    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getMyTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateMyBreakfastExpenseInStats(breakfastExpense, year, month, userIdx);

    // 조식 초과금 업데이트
    const { total: totalB, cnt: cntB } = await this.mealRepository.getMyBreakfastOverpay(year, month, userIdx);
    const breakfastOverpay: number = totalB - cntB * DEFAULT_BREAKFAST_RATE;
    await this.mealRepository.updateMyBreakfastOverpayInStats(breakfastOverpay, year, month, userIdx);

    // dinnerExpense(석식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getMyTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateMyDinnerExpenseInStats(dinnerExpense, year, month, userIdx);

    // 석식 초과금 업데이트
    const { total: totalD, cnt: cntD } = await this.mealRepository.getMyDinnerOverpay(year, month, userIdx);
    const dinnerOverpay: number = totalD - cntD * DEFAULT_DINNER_RATE;
    await this.mealRepository.updateMyDinnerOverpayInStats(dinnerOverpay, year, month, userIdx);

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(year.toString(), month.toString());

    return newMealInfo.targetDay;
  }

  @Transactional()
  async deleteMyMeal(userIdx: number, targetDay: string): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { year, month } = substringYearMonth(targetDay);

    await this.mealRepository.deleteMyMeal(userIdx, targetDay);

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getMyTotalHolidayWorkdays(year, month, userIdx);
    await this.mealRepository.updateMyHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx);

    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getMyTotalMealExpense(year, month, userIdx);
    await this.mealRepository.updateMyMealExpenseInStats(mealExpense, year, month, userIdx);

    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getMyTotalBreakfastExpense(year, month, userIdx);
    await this.mealRepository.updateMyBreakfastExpenseInStats(breakfastExpense, year, month, userIdx);

    // 조식 초과금 업데이트
    const { total: totalB, cnt: cntB } = await this.mealRepository.getMyBreakfastOverpay(year, month, userIdx);
    const breakfastOverpay: number = totalB - cntB * DEFAULT_BREAKFAST_RATE;
    await this.mealRepository.updateMyBreakfastOverpayInStats(breakfastOverpay, year, month, userIdx);

    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getMyTotalDinnerExpense(year, month, userIdx);
    await this.mealRepository.updateMyDinnerExpenseInStats(dinnerExpense, year, month, userIdx);

    // 석식 초과금 업데이트
    const { total: totalD, cnt: cntD } = await this.mealRepository.getMyDinnerOverpay(year, month, userIdx);
    const dinnerOverpay: number = totalD - cntD * DEFAULT_DINNER_RATE;
    await this.mealRepository.updateMyDinnerOverpayInStats(dinnerOverpay, year, month, userIdx);

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(year.toString(), month.toString());
  }

  async getMeal({ pageNo, perPage }: PageNoDto, filterInfo: AdminMealFilterDto) {
    const { totalPage, total, meal } = await this.mealRepository.getMeal(pageNo, perPage, filterInfo);

    return { totalPage, total, meal };
  }

  @Transactional()
  async createMealBudget(mealBudgetInfo: CreateMealBudgetDto): Promise<void> {
    const { year, month, baseAmount } = mealBudgetInfo;

    /* 기본 식대 저장 */
    const mealBaseInfo = await this.mealRepository.getMealBaseInfo(year, month);
    if (!mealBaseInfo) {
      // 기본 식대 정보가 없다면 create
      await this.mealRepository.createMealBase(year, month, baseAmount);
    } else if (mealBaseInfo.baseAmount !== baseAmount) {
      // 기본 식대 정보가 있고, 기존 정보랑 상이하다면 update
      await this.mealRepository.updateMealBase(year, month, baseAmount);
    }
    const mealStatsCnt: number = await this.mealRepository.getMealStatsCount(year, month);
    /* 기록이 없다면 통계 create (기록이 있다면 mealBudget은 트리거에 의해 자동 업데이트)*/
    if (mealStatsCnt < 1) {
      // holidays 불러오기
      const holidayDates: string[] = await this.mealRepository.getHolidayDates(year, month);
      // workdays 불러오기
      const holidays: number = holidayDates.length;
      const totalDays: number = getTotalDaysInMonth(year, month);
      const workdays: number = totalDays - holidays;
      // 식대 사용가능한 모든 유저의 IDX 불러오기
      const userIdxList: number[] = await this.mealRepository.getAllUserIdxExceptCEO();
      for (const userIdx of userIdxList) {
        const newMealStatsInfo: NewMealStats = {
          userIdx,
          workdays,
          holidays,
          mealBalance: 0,
        };
        await this.mealRepository.createMealBudget(mealBudgetInfo, newMealStatsInfo);
      }
    }

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(year, month);
  }

  async getMealBudget(pageNoInfo: PageNoDto, filterInfo: AdminMealBudgetFilterDto) {
    const { totalPage, total, mealBudget } = await this.mealRepository.getAdminMealBudget(pageNoInfo, filterInfo);
    const { year, month } = filterInfo;
    // holidays 불러오기
    const holidayDates: string[] = await this.mealRepository.getHolidayDates(year, month);
    // workdays 불러오기
    const holidays: number = holidayDates.length;
    const totalDays: number = getTotalDaysInMonth(year, month);
    const workdays: number = totalDays - holidays;

    return { totalPage, total, workdays, mealBudget };
  }

  @Transactional()
  async updateMealStatsNote(mealStatsIdx: number, noteInfo: UpdateNoteDto): Promise<void> {
    const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
    if (mealStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.mealRepository.updateMealStatsNote(mealStatsIdx, noteInfo);

    return;
  }

  async getUserMealStats({ year, month }: AdminMealBalanceFilterDto) {
    const result = await this.mealRepository.getUserMealStats(year, month);

    return result;
  }

  @Transactional()
  async updateClearStatusComplete(mealStatsIdxList: number[]): Promise<void> {
    for (const mealStatsIdx of mealStatsIdxList) {
      const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
      if (mealStatsCnt < 1) {
        throw new NotFoundException('존재하지 않는 통계 내역입니다.');
      }
      await this.mealRepository.updateClearStatusComplete(mealStatsIdx);
    }
  }

  @Transactional()
  async updateClearStatusNotYet(mealStatsIdxList: number[]): Promise<void> {
    for (const mealStatsIdx of mealStatsIdxList) {
      const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
      if (mealStatsCnt < 1) {
        throw new NotFoundException('존재하지 않는 통계 내역입니다.');
      }
      await this.mealRepository.updateClearStatusNotYet(mealStatsIdx);
    }
  }

  async getMealBalanceDetail(mealStatsIdx: number) {
    const mealStatsInfo = await this.mealRepository.getMealStatsInfoByIdx(mealStatsIdx);
    if (!mealStatsInfo) {
      throw new BadRequestException('해당 IDX에 대한 정보가 존재하지 않습니다.');
    }
    const { userIdx, year, month } = mealStatsInfo;
    const mealDetailInfo = await this.mealRepository.getMealDetail(year, month, userIdx);

    return mealDetailInfo;
  }
}
