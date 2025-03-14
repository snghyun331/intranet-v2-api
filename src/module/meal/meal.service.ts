import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MealRepository } from './repository/meal.repository';
import { CreateMealDto, MealInputDto } from './dto/createMeal.dto';
import { MealAttendanceEnum, MealTypeEnum, YNEnum } from '../../common/constant/enum';
import { MealEntity } from '../../entity/meal/meal.entity';
import { BasicMealData, DetailedMealData, MealStats, MealStatsAdminInfo } from './interface/meal.interface';
import { EntityManager } from 'typeorm';
import {
  MealAdminResult,
  MealBudgetAdminResult,
  MealBudgetTotalPageInfo,
  MealCalenderResult,
} from './interface/result.interface';
import { AdminMealBalanceFilterDto, AdminMealBudgetFilterDto, AdminMealFilterDto } from './dto/query.dto';
import { CreateMealBudgetDto } from './dto/createBudget.dto';
import { getTotalDaysInMonth } from '../../common/utils/utility';
import { NewMealStats } from '../scheduler/interface/meal.interface';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { DEFAULT_BREAKFAST_RATE, DEFAULT_DINNER_RATE } from '../../common/constant/constant';

@Injectable()
export class MealService {
  constructor(private readonly mealRepository: MealRepository) {}

  async getMyMeal(year: number, month: number, userIdx: number): Promise<MealCalenderResult> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const mealInfo: MealEntity[] = await this.mealRepository.getMyMealCalender(year, month, userIdx);
    const mealStats: MealStats = await this.mealRepository.getMyMealStats(year, month, userIdx);

    // 날짜별로 그룹화하여 meals를 구성
    const meals: any[] = mealInfo.reduce((acc, meal) => {
      const existingDate = acc.find((m) => m.start === meal.targetDay);

      const mealData: BasicMealData = {
        payerName: meal.payerName,
        place: meal.place,
        amount: meal.amount,
      };
      if (meal.mealType === MealTypeEnum.LUNCH && meal.attendance) {
        mealData.attendance = meal.attendance; // attendance가 있을 때만 추가
      } else if (meal.mealType === MealTypeEnum.LUNCH && !meal.attendance) {
        mealData.attendance = '';
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
          breakfast: meal.mealType === MealTypeEnum.BREAKFAST ? mealData : { payerName: '', place: '', amount: null },
          lunch:
            meal.mealType === MealTypeEnum.LUNCH
              ? mealData
              : { payerName: '', place: '', amount: null, attendance: '' },
          dinner: meal.mealType === MealTypeEnum.DINNER ? mealData : { payerName: '', place: '', amount: null },
        });
      }

      return acc;
    }, []);

    const result: MealCalenderResult = {
      mealStats,
      meals,
    };

    return result;
  }

  async createMyMeal(userIdx: number, newMealInfo: CreateMealDto, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const year: number = Number(newMealInfo.targetDay.substring(0, 4));
    const month: number = Number(newMealInfo.targetDay.substring(5, 7));

    // 아직 해당 월에 대한 meal_stats가 등록되지 않았다면 등록 불가 처리
    const mealStats: MealStats = await this.mealRepository.getMyMealStats(year, month, userIdx);
    if (!mealStats) {
      throw new BadRequestException('어드민에서 아직 사용가능금액 등록을 하지 않아, 식대 저장이 불가합니다.');
    }

    // 근무&휴일 (휴일근무)일 때 처리
    const monthHolidays: string[] = await this.mealRepository.getMonthHolidays(year, month);
    if (monthHolidays.includes(newMealInfo.targetDay)) {
      const attendance: MealAttendanceEnum = newMealInfo.attendance;
      if (attendance !== MealAttendanceEnum.WORKING) {
        throw new BadRequestException('휴일에는 근무일 때만 등록할 수 있습니다.');
      }
      newMealInfo.holidayYN = YNEnum.YES;
    }

    // 식대 등록 예외처리(연차/휴무 & 재택근무)
    if (
      newMealInfo.attendance === MealAttendanceEnum.REST ||
      newMealInfo.attendance === MealAttendanceEnum.REMOTE_WORK
    ) {
      if (
        this.isAnyFieldBlank(newMealInfo.breakfast) ||
        this.isAnyFieldBlank(newMealInfo.lunch) ||
        this.isAnyFieldBlank(newMealInfo.dinner)
      ) {
        throw new BadRequestException('연차/휴무 및 재택 근무는 식대 지원이 불가합니다.');
      }
    }
    // 식대 등록 예외처리(오후반차)
    if (newMealInfo.attendance === MealAttendanceEnum.PM_HALF) {
      if (
        this.isAnyFieldBlank(newMealInfo.breakfast) ||
        this.isAnyFieldBlank(newMealInfo.lunch) ||
        this.isAnyFieldBlank(newMealInfo.dinner)
      ) {
        throw new BadRequestException('오후 반차는 식대 지원이 불가합니다');
      }
    }
    // 식대 등록 예외처리(오전반차)
    if (newMealInfo.attendance === MealAttendanceEnum.AM_HALF) {
      if (this.isAnyFieldBlank(newMealInfo.lunch) || this.isAnyFieldBlank(newMealInfo.breakfast)) {
        throw new BadRequestException('오전 반차는 식대(조식, 중식) 지원이 불가합니다');
      }
    }

    // 중식 저장
    const newLunch: DetailedMealData = newMealInfo.lunch;
    const lunchInfo: { mealIdx: number } = await this.mealRepository.getMealIdx(
      userIdx,
      newMealInfo.targetDay,
      MealTypeEnum.LUNCH,
    );
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
      await this.mealRepository.updateMyMeal(lunchInfo.mealIdx, newLunch, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(userIdx, newMealInfo.targetDay, newLunch, MealTypeEnum.LUNCH, manager);
    }

    // 조식 저장
    const newBreakfast: DetailedMealData = newMealInfo.breakfast;
    const breakfastInfo: { mealIdx: number } = await this.mealRepository.getMealIdx(
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
      await this.mealRepository.updateMyMeal(breakfastInfo.mealIdx, newBreakfast, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(
        userIdx,
        newMealInfo.targetDay,
        newBreakfast,
        MealTypeEnum.BREAKFAST,
        manager,
      );
    }

    // 석식 저장
    const newDinner: DetailedMealData = newMealInfo.dinner;
    const dinnerInfo: { mealIdx: number } = await this.mealRepository.getMealIdx(
      userIdx,
      newMealInfo.targetDay,
      MealTypeEnum.DINNER,
    );

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
      await this.mealRepository.updateMyMeal(dinnerInfo.mealIdx, newDinner, manager);
    } else {
      // 기존 정보가 없을 경우 새로 생성
      await this.mealRepository.createMyMeal(userIdx, newMealInfo.targetDay, newDinner, MealTypeEnum.DINNER, manager);
    }

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getMyTotalTimeoffDays(year, month, userIdx, manager);
    await this.mealRepository.updateMyTimeOffDaysInStats(timeoffDays, year, month, userIdx, manager);

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getMyTotalHolidayWorkdays(year, month, userIdx, manager);
    await this.mealRepository.updateMyHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx, manager);

    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getMyTotalMealExpense(year, month, userIdx, manager);
    await this.mealRepository.updateMyMealExpenseInStats(mealExpense, year, month, userIdx, manager);

    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getMyTotalBreakfastExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.mealRepository.updateMyBreakfastExpenseInStats(breakfastExpense, year, month, userIdx, manager);

    // 조식 초과금 업데이트
    const { total: totalB, cnt: cntB }: { total: number; cnt: number } =
      await this.mealRepository.getMyBreakfastOverpay(year, month, userIdx, manager);
    const breakfastOverpay: number = totalB - cntB * DEFAULT_BREAKFAST_RATE;
    await this.mealRepository.updateMyBreakfastOverpayInStats(breakfastOverpay, year, month, userIdx, manager);

    // dinnerExpense(석식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getMyTotalDinnerExpense(year, month, userIdx, manager);
    await this.mealRepository.updateMyDinnerExpenseInStats(dinnerExpense, year, month, userIdx, manager);

    // 석식 초과금 업데이트
    const { total: totalD, cnt: cntD }: { total: number; cnt: number } = await this.mealRepository.getMyDinnerOverpay(
      year,
      month,
      userIdx,
      manager,
    );
    const dinnerOverpay: number = totalD - cntD * DEFAULT_DINNER_RATE;
    await this.mealRepository.updateMyDinnerOverpayInStats(dinnerOverpay, year, month, userIdx, manager);

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(year.toString(), month.toString(), manager);

    return newMealInfo.targetDay;
  }

  async deleteMyMeal(userIdx: number, targetDay: string, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.mealRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const year: number = Number(targetDay.substring(0, 4));
    const month: number = Number(targetDay.substring(5, 7));

    await this.mealRepository.deleteMyMeal(userIdx, targetDay, manager);

    // timeoffDays(반)연차/휴무일수) 업데이트
    const timeoffDays: number = await this.mealRepository.getMyTotalTimeoffDays(year, month, userIdx, manager);
    await this.mealRepository.updateMyTimeOffDaysInStats(timeoffDays, year, month, userIdx, manager);

    // holidayWorkdays(휴일근무일 수) 업데이트
    const holidayWorkdays: number = await this.mealRepository.getMyTotalHolidayWorkdays(year, month, userIdx, manager);
    await this.mealRepository.updateMyHolidayWorkdaysInStats(holidayWorkdays, year, month, userIdx, manager);

    // mealExpense(중식 사용금액) 업데이트
    const mealExpense: number = await this.mealRepository.getMyTotalMealExpense(year, month, userIdx, manager);
    await this.mealRepository.updateMyMealExpenseInStats(mealExpense, year, month, userIdx, manager);

    // breakExpense(조식 사용금액) 업데이트
    const breakfastExpense: number = await this.mealRepository.getMyTotalBreakfastExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.mealRepository.updateMyBreakfastExpenseInStats(breakfastExpense, year, month, userIdx, manager);

    // 조식 초과금 업데이트
    const { total: totalB, cnt: cntB }: { total: number; cnt: number } =
      await this.mealRepository.getMyBreakfastOverpay(year, month, userIdx, manager);
    const breakfastOverpay: number = totalB - cntB * DEFAULT_BREAKFAST_RATE;
    await this.mealRepository.updateMyBreakfastOverpayInStats(breakfastOverpay, year, month, userIdx, manager);

    // dinnerExpense(조식 사용금액) 업데이트
    const dinnerExpense: number = await this.mealRepository.getMyTotalDinnerExpense(year, month, userIdx, manager);
    await this.mealRepository.updateMyDinnerExpenseInStats(dinnerExpense, year, month, userIdx, manager);

    // 석식 초과금 업데이트
    const { total: totalD, cnt: cntD }: { total: number; cnt: number } = await this.mealRepository.getMyDinnerOverpay(
      year,
      month,
      userIdx,
      manager,
    );
    const dinnerOverpay: number = totalD - cntD * DEFAULT_DINNER_RATE;
    await this.mealRepository.updateMyDinnerOverpayInStats(dinnerOverpay, year, month, userIdx, manager);

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(year.toString(), month.toString(), manager);
  }

  /* 필드 중 하나라도 값이 있으면 true 반환 */
  private isAnyFieldBlank(mealInput: MealInputDto): boolean {
    return Object.values(mealInput).some((value) => value !== '' && value !== null);
  }

  async getMeal({ pageNo, perPage }: PageNoDto, filterInfo: AdminMealFilterDto): Promise<MealAdminResult> {
    const { totalPage, total, meal }: MealAdminResult = await this.mealRepository.getMeal(pageNo, perPage, filterInfo);

    return { totalPage, total, meal };
  }

  async createMealBudget(mealBudgetInfo: CreateMealBudgetDto, manager: EntityManager): Promise<void> {
    /* 기본 식대 저장 */
    const mealBaseInfo: { baseAmount: number } = await this.mealRepository.getMealBaseInfo(
      mealBudgetInfo.year,
      mealBudgetInfo.month,
    );
    if (!mealBaseInfo) {
      // 기본 식대 정보가 없다면 create
      await this.mealRepository.createMealBase(
        mealBudgetInfo.year,
        mealBudgetInfo.month,
        mealBudgetInfo.baseAmount,
        manager,
      );
    } else if (mealBaseInfo.baseAmount !== mealBudgetInfo.baseAmount) {
      // 기본 식대 정보가 있고, 기존 정보랑 상이하다면 update
      await this.mealRepository.updateMealBase(
        mealBudgetInfo.year,
        mealBudgetInfo.month,
        mealBudgetInfo.baseAmount,
        manager,
      );
    }
    const mealStatsCnt: number = await this.mealRepository.getMealStatsCount(mealBudgetInfo.year, mealBudgetInfo.month);
    /* 기록이 없다면 통계 create (기록이 있다면 mealBudget은 트리거에 의해 자동 업데이트)*/
    if (mealStatsCnt < 1) {
      const yearToNum = Number(mealBudgetInfo.year);
      const monthToNum = Number(mealBudgetInfo.month);
      // holidays 불러오기
      const holidayDates: string[] = await this.mealRepository.getHolidayDates(yearToNum, monthToNum);
      // workdays 불러오기
      const holidays: number = holidayDates.length;
      const totalDays: number = getTotalDaysInMonth(yearToNum, monthToNum);
      const workdays: number = totalDays - holidays;
      // 식대 사용가능한 모든 유저의 IDX 불러오기
      const userIdxList: number[] = await this.mealRepository.getAllUserIdxExceptCEO();
      await Promise.all(
        userIdxList.map(async (userIdx) => {
          const newMealStatsInfo: NewMealStats = {
            userIdx,
            workdays,
            holidays,
            mealBalance: 0,
          };
          await this.mealRepository.createMealBudget(mealBudgetInfo, newMealStatsInfo, manager);
        }),
      );
    }

    // 마지막: 각종 업데이트에 따른 사용가능금액 업데이트
    await this.mealRepository.updateMealBudget(mealBudgetInfo.year, mealBudgetInfo.month, manager);
  }

  async getMealBudget(pageNoInfo: PageNoDto, filterInfo: AdminMealBudgetFilterDto): Promise<MealBudgetAdminResult> {
    const { totalPage, total, mealBudget }: MealBudgetTotalPageInfo = await this.mealRepository.getAdminMealBudget(
      pageNoInfo,
      filterInfo,
    );
    const yearToNum = Number(filterInfo.year);
    const monthToNum = Number(filterInfo.month);
    // holidays 불러오기
    const holidayDates: string[] = await this.mealRepository.getHolidayDates(yearToNum, monthToNum);
    // workdays 불러오기
    const holidays: number = holidayDates.length;
    const totalDays: number = getTotalDaysInMonth(yearToNum, monthToNum);
    const workdays: number = totalDays - holidays;

    return { totalPage, total, workdays, mealBudget };
  }

  async updateMealStatsNote(mealStatsIdx: number, noteInfo: UpdateNoteDto, manager: EntityManager): Promise<void> {
    const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
    if (mealStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.mealRepository.updateMealStatsNote(mealStatsIdx, noteInfo, manager);

    return;
  }

  async getUserMealStats({ year, month }: AdminMealBalanceFilterDto): Promise<MealStatsAdminInfo[]> {
    const result: MealStatsAdminInfo[] = await this.mealRepository.getUserMealStats(year, month);

    return result;
  }

  async updateClearStatusComplete(mealStatsIdxList: number[], manager: EntityManager): Promise<void> {
    await Promise.all(
      mealStatsIdxList.map(async (mealStatsIdx) => {
        const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
        if (mealStatsCnt < 1) {
          throw new NotFoundException('존재하지 않는 통계 내역입니다.');
        }
        await this.mealRepository.updateClearStatusComplete(mealStatsIdx, manager);
      }),
    );
  }

  async updateClearStatusNotYet(mealStatsIdxList: number[], manager: EntityManager): Promise<void> {
    await Promise.all(
      mealStatsIdxList.map(async (mealStatsIdx) => {
        const mealStatsCnt: number = await this.mealRepository.getMealStatsCountByIdx(mealStatsIdx);
        if (mealStatsCnt < 1) {
          throw new NotFoundException('존재하지 않는 통계 내역입니다.');
        }
        await this.mealRepository.updateClearStatusNotYet(mealStatsIdx, manager);
      }),
    );
  }

  async getMealBalanceDetail(mealStatsIdx: number): Promise<MealEntity[]> {
    const mealStatsInfo = await this.mealRepository.getMealStatsInfoByIdx(mealStatsIdx);
    if (!mealStatsInfo) {
      throw new BadRequestException('해당 IDX에 대한 정보가 존재하지 않습니다.');
    }
    const { userIdx, year, month } = mealStatsInfo;
    const yearToNum: number = Number(year);
    const monthToNum: number = Number(month);

    const mealDetailInfo: MealEntity[] = await this.mealRepository.getMealDetail(yearToNum, monthToNum, userIdx);

    return mealDetailInfo;
  }
}
