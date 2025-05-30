import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalRepository } from './repository/approval.repository';
import { ConfirmEnum } from '../../../common/constant/enum';
import { addConfirmStatusField, calculateAvailCheckOutTime, substringYearMonth } from '../../../common/utils/utility';
import { UserApprovalFilter } from './dto/query.dto';
import { ALTERNATIVE_LEAVE_LISTS, ANNUAL_LEAVE_LISTS, SPECIAL_LEAVE_LISTS } from '../../../common/constant/constant';
import { Transactional } from 'typeorm-transactional';
import { GlobalMealRepository } from '../../global/repository/globalMeal.repository';
import { GlobalUserRepository } from '../../global/repository/globalUser.repository';
import { UpdateLastCheckTimeDto } from './dto/updateLastCheck.dto';

@Injectable()
export class ApprovalService {
  constructor(
    private readonly approvalRepository: ApprovalRepository,
    private readonly mealRepository: GlobalMealRepository,
    private readonly userRepository: GlobalUserRepository,
  ) {}

  @Transactional()
  async confirmLeave(commuteIdx: number, confirmPersonIdx: number, confirmYN: ConfirmEnum): Promise<void> {
    if (confirmYN === ConfirmEnum.NO) {
      throw new BadRequestException('승인 취소 기능은 아직 제공하지 않습니다.');
    }
    const commuteInfoWithApprover = await this.approvalRepository.getCommuteInfoWithApprover(commuteIdx);
    if (!commuteInfoWithApprover) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    const existing = commuteInfoWithApprover.find((info: any) => info.approverIdx === confirmPersonIdx);
    if (!existing) {
      throw new BadRequestException('승인 가능한 대상자로 등록되지 않았습니다.');
    }
    if (confirmYN === ConfirmEnum.YES && existing.confirmYN === ConfirmEnum.YES) {
      throw new BadRequestException('이미 승인완료 된 내역입니다.');
    }
    if (confirmYN === ConfirmEnum.REJECT && existing.confirmYN === ConfirmEnum.REJECT) {
      throw new BadRequestException('이미 반려된 내역입니다.');
    }

    /* 승인여부 업데이트 */
    await this.approvalRepository.updateConfirm(commuteIdx, confirmPersonIdx, confirmYN);

    /*
     승인여부 업데이트에 따른 휴가 산정 변경 
    */
    const userIdx: number = existing.userIdx; // 휴가를 올린 사용자 IDX

    const { year, month } = substringYearMonth(existing.commuteDate);
    const leaveTypeIdx: number = existing.leaveTypeIdx;

    /* 승인일 경우, */
    if (confirmYN === ConfirmEnum.YES) {
      // 이미 출근을 한 상태인 경우, 퇴근가능시간 업데이트
      if (existing.checkInTime) {
        const isBirthday: boolean = await this.userRepository.isBirthday(userIdx, existing.commuteDate); // 생일여부 확인
        const availCheckOutTime: Date = calculateAvailCheckOutTime(
          existing.checkInTime,
          leaveTypeIdx,
          ConfirmEnum.YES,
          isBirthday,
        );

        await this.approvalRepository.updateAvailCheckOutTime(commuteIdx, availCheckOutTime);
      }

      const useCount: number = await this.approvalRepository.getTotalLeaveCountForMonth(
        // 휴가 유형에 대한 해당 월 사용개수
        year,
        month,
        userIdx,
        leaveTypeIdx,
      );
      // 해당 월 사용개수 업데이트
      await this.approvalRepository.updateLeaveMonthlyUseCount(year, month, userIdx, leaveTypeIdx, useCount);

      // 해당 연도 사용개수 업데이트
      await this.approvalRepository.updateLeaveAnnualUseCount(year, userIdx, leaveTypeIdx);

      // 해당 연도 연차 총 사용량 업데이트
      if (ANNUAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx);
      }
      // 해당 연도 특별휴무 총 사용량 업데이트
      if (SPECIAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalSpecialLeaveUsage(year, userIdx);
      }
      // 해당 연도 대체휴무 총 사용량 업데이트
      if (ALTERNATIVE_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAlternativeLeaveUsage(year, userIdx);
      }

      // 식대 해당 월 timeoffDays 업데이트
      await this.mealRepository.updateMealTimeOffDays(year, month, userIdx);
      // timeoffDays업데이트에 따른 식대 사용가능금액 업데이트
      await this.mealRepository.updateMealBudget(year.toString(), month.toString());
    }

    /* 승인이었다가 반려될 경우 */
    if (confirmYN === ConfirmEnum.REJECT && existing.confirmYN === ConfirmEnum.YES) {
      // 이미 출근을 한 상태인 경우, 퇴근가능시간 업데이트
      if (existing.checkInTime) {
        const isBirthday: boolean = await this.userRepository.isBirthday(userIdx, existing.commuteDate); // 생일여부 확인
        const availCheckOutTime: Date = calculateAvailCheckOutTime(
          existing.checkInTime,
          leaveTypeIdx,
          ConfirmEnum.REJECT,
          isBirthday,
        );

        await this.approvalRepository.updateAvailCheckOutTime(commuteIdx, availCheckOutTime);
      }

      // 휴가 차감 단위 업데이트
      const leaveReduceUnit = 0; // 초기화
      await this.approvalRepository.updateLeaveReduceUnit(commuteIdx, leaveReduceUnit);

      const useCount: number = await this.approvalRepository.getTotalLeaveCountForMonth(
        // 휴가 유형에 대한 해당 월 사용개수
        year,
        month,
        userIdx,
        leaveTypeIdx,
      );
      // 해당 월 사용개수 -1
      await this.approvalRepository.updateLeaveMonthlyUseCount(year, month, userIdx, leaveTypeIdx, useCount);

      // 해당 연도 사용개수
      await this.approvalRepository.updateLeaveAnnualUseCount(year, userIdx, leaveTypeIdx);

      // 해당 연도 연차 총 사용량 업데이트
      if (ANNUAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx);
      }
      // 해당 연도 특별휴무 총 사용량 업데이트
      if (SPECIAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalSpecialLeaveUsage(year, userIdx);
      }
      // 해당 연도 대체휴무 총 사용량 업데이트
      if (ALTERNATIVE_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAlternativeLeaveUsage(year, userIdx);
      }

      // 식대 해당 월 timeoffDays 업데이트
      await this.mealRepository.updateMealTimeOffDays(year, month, userIdx);
      // timeoffDays업데이트에 따른 식대 사용가능금액 업데이트
      await this.mealRepository.updateMealBudget(year.toString(), month.toString());
    }
  }

  async getApprovalHistory(userIdx: number, filterInfo: UserApprovalFilter) {
    const histories = await this.approvalRepository.getApprovalHistory(userIdx, filterInfo);

    const result = await Promise.all(
      histories.map(async (history) => {
        const confirmStatus: string = addConfirmStatusField(history.confirmYN, history.confirmDate, history.rejectDate);

        return {
          ...history,
          confirmStatus,
          isNew: history.approverLastCheckedAt || history.ccUserLastCheckedAt ? false : true, // 마지막 확인 시간 이후에 생성된 내역인지 여부
        };
      }),
    );

    return result;
  }

  async hasNewApproval(userIdx: number) {
    const count: number = await this.approvalRepository.getNewApprovalCount(userIdx);
    const hasNew: boolean = count > 0;

    return hasNew;
  }

  @Transactional()
  async updateLastApprovalCheckAt(
    userIdx: number,
    commuteIdx: number,
    { relationType, lastCheckedAt }: UpdateLastCheckTimeDto,
  ): Promise<void> {
    if (relationType === 'APPROVER') {
      await this.approvalRepository.updateLastApproverCheckedAt(userIdx, commuteIdx, lastCheckedAt);
    } else if (relationType == 'CC') {
      await this.approvalRepository.updateLastCCUserCheckedAt(userIdx, commuteIdx, lastCheckedAt);
    } else {
      throw new BadRequestException('잘못된 relationType을 입력하였습니다. ');
    }

    return;
  }
}
