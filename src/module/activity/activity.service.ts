import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateActivityDto } from './dto/createActivity.dto';
import { EntityManager } from 'typeorm';
import { ActivityRepository } from './repository/activity.repository';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { ACTIVITY_APPROVERS } from '../../common/constant/constant';
import { ActivityInfo } from './interface/activity.interface';

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

  async getActivity(year: string, month: string) {}
}
