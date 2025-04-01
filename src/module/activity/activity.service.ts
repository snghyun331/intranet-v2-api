import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/createActivity.dto';
import { EntityManager } from 'typeorm';
import { ActivityRepository } from './repository/activity.repository';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import {
  Activities,
  ActivityInfo,
  ActivityStats,
  ActivityStatsAdminInfo,
  NewActivityMonthStats,
  NewActivityStats,
} from './interface/activity.interface';
import { UserPayload } from '../../common/interface/payload.interface';
import { ConfirmEnum, HalfYearEnum, UserGradeIdxEnum } from '../../common/constant/enum';
import { ActivityBudgetAdminResult, ActivityResult } from './interface/result.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminActivityBalanceFilterDto, AdminActivityBudgetFilterDto, AdminActivityFilterDto } from './dto/query.dto';
import { CreateActivityBudgetDto } from './dto/createBudget.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { UpdateBudgetDto } from './dto/updateBudget.dto';
import { substringYearMonth } from '../../common/utils/utility';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async createActivity(userIdx: number, newActivityInfo: CreateActivityDto, manager: EntityManager): Promise<string> {
    const { targetDay, payerName } = newActivityInfo;
    const userCnt: number = await this.activityRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerInfo: any = await this.activityRepository.getUserIdxByName(payerName);
    if (!payerInfo) {
      throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
    }
    const { userIdx: payerUserIdx, gradeIdx: payerGradeIdx } = payerInfo;
    if (
      payerGradeIdx !== UserGradeIdxEnum.CEO &&
      payerGradeIdx !== UserGradeIdxEnum.DIRECTOR &&
      payerGradeIdx !== UserGradeIdxEnum.MANAGER
    ) {
      throw new BadRequestException('결제자 란에는 CEO, 본부장, 팀장만 기입할 수 있습니다.');
    }

    const { year, month } = substringYearMonth(targetDay);

    const statsCnt: number = await this.activityRepository.getActivityMonthStatsCnt(payerUserIdx, year, month);
    if (statsCnt < 1) {
      throw new BadRequestException('아직 활동비를 작성할 수 없습니다.');
    }

    await this.activityRepository.createActivity(payerUserIdx, newActivityInfo, manager);

    // 활동비 월별 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx, manager);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx, manager);

    return targetDay;
  }

  async updateActivity(
    userIdx: number,
    activityIdx: number,
    updateActivityInfo: UpdateActivityDto,
    manager: EntityManager,
  ): Promise<string> {
    const { targetDay, payerName } = updateActivityInfo;
    const userCnt: number = await this.activityRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerInfo: any = await this.activityRepository.getUserIdxByName(payerName);
    if (!payerInfo) {
      throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
    }
    const { userIdx: payerUserIdx, gradeIdx: payerGradeIdx } = payerInfo;
    if (
      payerGradeIdx !== UserGradeIdxEnum.CEO &&
      payerGradeIdx !== UserGradeIdxEnum.DIRECTOR &&
      payerGradeIdx !== UserGradeIdxEnum.MANAGER
    ) {
      throw new BadRequestException('결제자 란에는 CEO, 본부장, 팀장만 기입할 수 있습니다.');
    }

    const activityInfo: ActivityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
    if (!activityInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    const { year, month } = substringYearMonth(targetDay);

    // 내역 업데이트
    await this.activityRepository.updateActivity(activityIdx, updateActivityInfo, manager);

    // 활동비 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx, manager);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx, manager);

    return targetDay;
  }

  async deleteActivity(userIdx: number, activityIdx: number, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.activityRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const activityInfo: ActivityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
    if (!activityInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    const { targetDay, payerName } = activityInfo;

    const payerInfo: any = await this.activityRepository.getUserIdxByName(payerName);
    const { userIdx: payerUserIdx } = payerInfo; // 결제자 IDX

    const { year, month } = substringYearMonth(targetDay);

    await this.activityRepository.deleteActivity(activityIdx, manager);

    // 활동비 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx, manager);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx, manager);

    return targetDay;
  }

  async getActivity(year: string, halfYear: HalfYearEnum, user: UserPayload) {
    const activityInfo: Activities[] = await this.activityRepository.getHalfYearActivities(year, halfYear, user);
    const activityStats: ActivityStats = await this.activityRepository.getActivityStats(year, halfYear, user);

    const result: ActivityResult = {
      activityStats,
      activities: activityInfo,
    };

    return result;
  }

  async getAdminActivity({ pageNo, perPage }: PageNoDto, filterInfo: AdminActivityFilterDto) {
    const { totalPage, total, activity } = await this.activityRepository.getActivity(pageNo, perPage, filterInfo);

    return { totalPage, total, activity };
  }

  async createActivityBudget(budgetInfo: CreateActivityBudgetDto, manager: EntityManager): Promise<void> {
    const date: Date = new Date();
    const year: string = date.getFullYear().toString();
    const halfYear: HalfYearEnum = budgetInfo.period;
    const activityBudget: number = budgetInfo.activityBudget;
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCount(budgetInfo, year);

    /** 기록이 없다면 통계 create (기록이 있다면 통계 업데이트) **/
    if (activityStatsCnt < 1) {
      /* 월별 통계 create */
      // 상반기일 경우
      if (halfYear === HalfYearEnum.H1) {
        for (let i = 1; i < 7; i++) {
          const newActivityMonthStatsInfo: NewActivityMonthStats = {
            userIdx: budgetInfo.userIdx,
            year,
            month: i.toString(),
            activityMonthExpense: 0,
          };
          await this.activityRepository.createActivityMonthStats(newActivityMonthStatsInfo, manager);
        }
      } else {
        // 하반기일 경우
        for (let i = 7; i < 13; i++) {
          const newActivityMonthStatsInfo: NewActivityMonthStats = {
            userIdx: budgetInfo.userIdx,
            year,
            month: i.toString(),
            activityMonthExpense: 0,
          };
          await this.activityRepository.createActivityMonthStats(newActivityMonthStatsInfo, manager);
        }
      }
      /* 반기별 통계 create */
      const newActivityStatsInfo: NewActivityStats = {
        userIdx: budgetInfo.userIdx,
        year,
        halfYear,
        activityBudget,
        memberCount: budgetInfo.memberCount,
        budgetPerMember: budgetInfo.budgetPerMember,
      };
      await this.activityRepository.createActivityStats(newActivityStatsInfo, manager);
    } else {
      /** 기록이 있다면 409 에러 **/
      throw new ConflictException('이미 새로 등록하였습니다.');
    }

    return;
  }

  async getActivityBudget(filterInfo: AdminActivityBudgetFilterDto): Promise<ActivityBudgetAdminResult[]> {
    const date: Date = new Date();
    const year: string = date.getFullYear().toString();

    let halfYear: HalfYearEnum;
    if (!filterInfo.halfYear) {
      const nowMonth: number = date.getMonth() + 1;
      halfYear = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    } else {
      halfYear = filterInfo.halfYear;
    }

    const result: ActivityBudgetAdminResult[] = await this.activityRepository.getAdminActivityBudget(year, halfYear);

    return result;
  }

  async updateActivityBudget(
    activityStatsIdx: number,
    budgetInfo: UpdateBudgetDto,
    manager: EntityManager,
  ): Promise<void> {
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
    if (activityStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.activityRepository.updateActivityBudget(activityStatsIdx, budgetInfo, manager);

    return;
  }

  async updateActivityStatsNote(
    activityStatsIdx: number,
    noteInfo: UpdateNoteDto,
    manager: EntityManager,
  ): Promise<void> {
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
    if (activityStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }

    await this.activityRepository.updateActivityStatsNote(activityStatsIdx, noteInfo, manager);
    return;
  }

  async updateConfirmActivity(
    activityIdxList: number[],
    confirmYN: ConfirmEnum,
    manager: EntityManager,
  ): Promise<void> {
    await Promise.all(
      activityIdxList.map(async (activityIdx) => {
        const activityInfo: ActivityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
        if (!activityInfo) {
          throw new NotFoundException(`해당 내역은 존재하지 않거나 삭제되었습니다: activityIdx: ${activityIdx}`);
        }
        await this.activityRepository.updateConfirmActivity(activityIdx, confirmYN, manager);
      }),
    );

    return;
  }

  async getUserActivityStats({ year, halfYear }: AdminActivityBalanceFilterDto): Promise<ActivityStatsAdminInfo[]> {
    const result: ActivityStatsAdminInfo[] = await this.activityRepository.getUserActivityStats(year, halfYear);

    return result;
  }

  async updateClearStatusComplete(activityStatsIdxList: number[], manager: EntityManager): Promise<void> {
    await Promise.all(
      activityStatsIdxList.map(async (activityStatsIdx) => {
        const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
        if (activityStatsCnt < 1) {
          throw new NotFoundException(`존재하지 않는 통계 내역입니다: activityStatsIdx: ${activityStatsIdx}`);
        }
        await this.activityRepository.updateClearStatusComplete(activityStatsIdx, manager);
      }),
    );
  }

  async updateClearStatusNotYet(activityStatsIdxList: number[], manager: EntityManager): Promise<void> {
    await Promise.all(
      activityStatsIdxList.map(async (activityStatsIdx) => {
        const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
        if (activityStatsCnt < 1) {
          throw new NotFoundException('존재하지 않는 통계 내역입니다.');
        }
        await this.activityRepository.updateClearStatusNotYet(activityStatsIdx, manager);
      }),
    );
  }
}
