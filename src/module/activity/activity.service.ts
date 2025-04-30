import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/createActivity.dto';
import { ActivityRepository } from './repository/activity.repository';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { NewActivityMonthStats, NewActivityStats } from './interface';
import { UserPayload } from '../../common/interface/payload.interface';
import { ConfirmEnum, HalfYearEnum, UserGradeIdxEnum } from '../../common/constant/enum';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminActivityBalanceFilterDto, AdminActivityBudgetFilterDto, AdminActivityFilterDto } from './dto/query.dto';
import { CreateActivityBudgetDto } from './dto/createBudget.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { UpdateBudgetDto } from './dto/updateBudget.dto';
import { substringYearMonth } from '../../common/utils/utility';
import { Transactional } from 'typeorm-transactional';
import { GlobalUserRepository } from '../common/repository/globalUser.repository';

@Injectable()
export class ActivityService {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly userRepository: GlobalUserRepository,
  ) {}

  @Transactional()
  async createActivity(userIdx: number, newActivityInfo: CreateActivityDto): Promise<string> {
    const { targetDay, payerName } = newActivityInfo;
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerInfo: any = await this.userRepository.getUserIdxByName(payerName);
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

    await this.activityRepository.createActivity(payerUserIdx, newActivityInfo);

    // 활동비 월별 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(year, month, payerName);
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx);

    return targetDay;
  }

  @Transactional()
  async updateActivity(userIdx: number, activityIdx: number, updateActivityInfo: UpdateActivityDto): Promise<string> {
    const { targetDay, payerName } = updateActivityInfo;
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerInfo: any = await this.userRepository.getUserIdxByName(payerName);
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

    const activityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
    if (!activityInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    const { year, month } = substringYearMonth(targetDay);

    // 내역 업데이트
    await this.activityRepository.updateActivity(activityIdx, updateActivityInfo);

    // 활동비 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(year, month, payerName);
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx);

    return targetDay;
  }

  @Transactional()
  async deleteActivity(userIdx: number, activityIdx: number): Promise<string> {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const activityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
    if (!activityInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    const { targetDay, payerName } = activityInfo;

    const payerInfo: any = await this.userRepository.getUserIdxByName(payerName);
    const { userIdx: payerUserIdx } = payerInfo; // 결제자 IDX

    const { year, month } = substringYearMonth(targetDay);

    await this.activityRepository.deleteActivity(activityIdx);

    // 활동비 사용금액 업데이트
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(year, month, payerName);
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerUserIdx);

    // 활동비 반기별 사용금액 업데이트
    await this.activityRepository.updateActivityExpense(year, month, payerUserIdx);

    return targetDay;
  }

  async getActivity(year: string, halfYear: HalfYearEnum, user: UserPayload) {
    const activityInfo = await this.activityRepository.getHalfYearActivities(year, halfYear, user);
    const activityStats = await this.activityRepository.getActivityStats(year, halfYear, user);

    const result = {
      activityStats,
      activities: activityInfo,
    };

    return result;
  }

  async getAdminActivity({ pageNo, perPage }: PageNoDto, filterInfo: AdminActivityFilterDto) {
    const { totalPage, total, activity } = await this.activityRepository.getActivity(pageNo, perPage, filterInfo);

    return { totalPage, total, activity };
  }

  @Transactional()
  async createActivityBudget(budgetInfo: CreateActivityBudgetDto): Promise<void> {
    const { year, period: halfYear, activityBudget } = budgetInfo;
    const userIdxList: number[] = await this.userRepository.getManagerOrHigherUserIdxList();
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCount(budgetInfo, year);

    /** 기록이 없다면 통계 create (기록이 있다면 통계 업데이트) **/
    if (activityStatsCnt < 1) {
      /* 월별 통계 create */
      // 상반기일 경우
      if (halfYear === HalfYearEnum.H1) {
        for (let i = 1; i < 7; i++) {
          for (const userIdx of userIdxList) {
            const newActivityMonthStatsInfo: NewActivityMonthStats = {
              userIdx,
              year,
              month: i.toString(),
              activityMonthExpense: 0,
            };
            await this.activityRepository.createActivityMonthStats(newActivityMonthStatsInfo);
          }
        }
      } else {
        // 하반기일 경우
        for (let i = 7; i < 13; i++) {
          for (const userIdx of userIdxList) {
            const newActivityMonthStatsInfo: NewActivityMonthStats = {
              userIdx,
              year,
              month: i.toString(),
              activityMonthExpense: 0,
            };
            await this.activityRepository.createActivityMonthStats(newActivityMonthStatsInfo);
          }
        }
      }
      /* 반기별 통계 create */
      for (const userIdx of userIdxList) {
        const newActivityStatsInfo: NewActivityStats = {
          userIdx,
          year,
          halfYear,
          activityBudget,
        };
        await this.activityRepository.createActivityStats(newActivityStatsInfo);
      }
    } else {
      // update
      const newActivityStatsInfo: NewActivityStats = {
        year,
        halfYear,
        activityBudget,
      };
      await this.activityRepository.updateActivityStats(newActivityStatsInfo);
    }

    return;
  }

  async getActivityBudget(filterInfo: AdminActivityBudgetFilterDto) {
    const date: Date = new Date();
    const year: string = date.getFullYear().toString();

    let halfYear: HalfYearEnum;
    if (!filterInfo.halfYear) {
      const nowMonth: number = date.getMonth() + 1;
      halfYear = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    } else {
      halfYear = filterInfo.halfYear;
    }

    const result = await this.activityRepository.getAdminActivityBudget(year, halfYear);

    return result;
  }

  @Transactional()
  async updateActivityBudget(activityStatsIdx: number, budgetInfo: UpdateBudgetDto): Promise<void> {
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
    if (activityStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.activityRepository.updateActivityBudget(activityStatsIdx, budgetInfo);

    return;
  }

  @Transactional()
  async updateActivityStatsNote(activityStatsIdx: number, noteInfo: UpdateNoteDto): Promise<void> {
    const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
    if (activityStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }

    await this.activityRepository.updateActivityStatsNote(activityStatsIdx, noteInfo);

    return;
  }

  @Transactional()
  async updateConfirmActivity(activityIdxList: number[], confirmYN: ConfirmEnum): Promise<void> {
    for (const activityIdx of activityIdxList) {
      const activityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
      if (!activityInfo) {
        throw new NotFoundException(`해당 내역은 존재하지 않거나 삭제되었습니다: activityIdx: ${activityIdx}`);
      }

      await this.activityRepository.updateConfirmActivity(activityIdx, confirmYN);
    }

    return;
  }

  async getUserActivityStats({ year, halfYear }: AdminActivityBalanceFilterDto) {
    const result = await this.activityRepository.getUserActivityStats(year, halfYear);

    return result;
  }

  @Transactional()
  async updateClearStatusComplete(activityStatsIdxList: number[]): Promise<void> {
    for (const activityStatsIdx of activityStatsIdxList) {
      const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
      if (activityStatsCnt < 1) {
        throw new NotFoundException(`존재하지 않는 통계 내역입니다: activityStatsIdx: ${activityStatsIdx}`);
      }
      await this.activityRepository.updateClearStatusComplete(activityStatsIdx);
    }
  }

  @Transactional()
  async updateClearStatusNotYet(activityStatsIdxList: number[]): Promise<void> {
    for (const activityStatsIdx of activityStatsIdxList) {
      const activityStatsCnt: number = await this.activityRepository.getActivityStatsCountByIdx(activityStatsIdx);
      if (activityStatsCnt < 1) {
        throw new NotFoundException('존재하지 않는 통계 내역입니다.');
      }
      await this.activityRepository.updateClearStatusNotYet(activityStatsIdx);
    }
  }
}
