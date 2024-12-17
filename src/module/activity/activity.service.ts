import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/createActivity.dto';
import { EntityManager } from 'typeorm';
import { ActivityRepository } from './repository/activity.repository';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { ACTIVITY_APPROVERS } from '../../common/constant/constant';
import { Activities, ActivityInfo, ActivityStats } from './interface/activity.interface';
import { UserPayload } from '../../common/interface/payload.interface';
import { HalfYearEnum } from '../../common/constant/enum';
import { ActivityResult } from './interface/result.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminActivityFilterDto } from './dto/query.dto';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  async createActivity(userIdx: number, newActivityInfo: CreateActivityDto, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.activityRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerIdxInfo: { userIdx: number } = await this.activityRepository.getUserIdxByName(newActivityInfo.payerName);
    if (!payerIdxInfo) {
      throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
    }
    if (!ACTIVITY_APPROVERS.includes(newActivityInfo.payerName)) {
      throw new BadRequestException('결제자 란에는 본부장 혹은 P&C 팀장만 기입할 수 있습니다.');
    }

    const year: number = Number(newActivityInfo.targetDay.substring(0, 4));
    const month: number = Number(newActivityInfo.targetDay.substring(5, 7));

    await this.activityRepository.createActivity(userIdx, newActivityInfo, manager);

    // 활동비 사용금액 업데이트
    const { userIdx: payerIdx } = payerIdxInfo; // 결제자 IDX
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      newActivityInfo.payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerIdx, manager);

    return newActivityInfo.targetDay;
  }

  async updateActivity(
    userIdx: number,
    activityIdx: number,
    updateActivityInfo: UpdateActivityDto,
    manager: EntityManager,
  ): Promise<string> {
    const userCnt: number = await this.activityRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const payerIdxInfo: { userIdx: number } = await this.activityRepository.getUserIdxByName(
      updateActivityInfo.payerName,
    );
    if (!payerIdxInfo) {
      throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
    }
    if (!ACTIVITY_APPROVERS.includes(updateActivityInfo.payerName)) {
      throw new BadRequestException('결제자 란에는 본부장 혹은 P&C 팀장만 기입할 수 있습니다.');
    }

    const activityInfo: ActivityInfo = await this.activityRepository.getActivityInfoByIdx(activityIdx);
    if (!activityInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    const year: number = Number(activityInfo.targetDay.substring(0, 4));
    const month: number = Number(activityInfo.targetDay.substring(5, 7));

    // 본인 결제자의 내역 업데이트
    await this.activityRepository.updateActivity(activityIdx, updateActivityInfo, manager);

    // 활동비 사용금액 업데이트
    const { userIdx: payerIdx } = payerIdxInfo; // 결제자 IDX
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      updateActivityInfo.payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerIdx, manager);

    return updateActivityInfo.targetDay;
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

    const payerIdxInfo: { userIdx: number } = await this.activityRepository.getUserIdxByName(activityInfo.payerName);

    const year: number = Number(activityInfo.targetDay.substring(0, 4));
    const month: number = Number(activityInfo.targetDay.substring(5, 7));

    await this.activityRepository.deleteActivity(activityIdx, manager);

    // 활동비 사용금액 업데이트
    const { userIdx: payerIdx } = payerIdxInfo; // 결제자 IDX
    const activityMonthExpense: number = await this.activityRepository.getTotalActivityExpense(
      year,
      month,
      activityInfo.payerName,
      manager,
    );
    await this.activityRepository.updateMonthlyActivityStats(activityMonthExpense, year, month, payerIdx, manager);

    return activityInfo.targetDay;
  }

  async getActivity(year: string, month: string[], user: UserPayload) {
    let activityInfo: Activities[] = [];

    if (year && month) {
      const yearToNum: number = Number(year);
      activityInfo = await this.activityRepository.getMonthActivities(yearToNum, month, user);
    } else if (!year && !month) {
      activityInfo = await this.activityRepository.getAllActivities(user);
    } else {
      throw new BadRequestException('연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다');
    }

    const nowDate: Date = new Date();
    const nowYear: number = nowDate.getFullYear();
    const nowMonth: number = nowDate.getMonth() + 1;
    const halfYear: HalfYearEnum = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    const activityStats: ActivityStats = await this.activityRepository.getActivityStats(nowYear, halfYear, user);

    const result: ActivityResult = {
      activityStats,
      activities: activityInfo,
    };

    return result;
  }

  async getAdminActivity({ pageNo, perPage }: PageNoDto, filterInfo: AdminActivityFilterDto) {}
}
