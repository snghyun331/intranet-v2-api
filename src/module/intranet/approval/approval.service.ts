import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalRepository } from './repository/approval.repository';
import { EntityManager } from 'typeorm';
import { ConfirmEnum } from '../../../common/constant/enum';
import { addConfirmStatusField, substringYearMonth } from '../../../common/utils/utility';
import { UserApprovalFilter } from './dto/query.dto';
import { ALTERNATIVE_LEAVE_LISTS, ANNUAL_LEAVE_LISTS, SPECIAL_LEAVE_LISTS } from '../../../common/constant/constant';

@Injectable()
export class ApprovalService {
  constructor(private readonly approvalRepository: ApprovalRepository) {}

  async confirmLeave(
    commuteIdx: number,
    confirmPersonIdx: number,
    confirmYN: ConfirmEnum,
    manager: EntityManager,
  ): Promise<void> {
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
    await this.approvalRepository.updateConfirm(commuteIdx, confirmPersonIdx, confirmYN, manager);

    /* 승인여부 업데이트에 따른 휴가 산정 변경 */
    const userIdx: number = existing.userIdx; // 휴가를 올린 사용자 IDX

    if (confirmYN === ConfirmEnum.YES) {
      const { year, month } = substringYearMonth(existing.commuteDate);

      const leaveTypeIdx: number = existing.leaveTypeIdx;
      const useCount: number = await this.approvalRepository.getTotalLeaveCountForMonth(
        year,
        month,
        userIdx,
        leaveTypeIdx,
        manager,
      );

      // 월별 사용개수 업데이트
      await this.approvalRepository.updateLeaveMonthlyUseCount(year, month, userIdx, leaveTypeIdx, useCount, manager);

      // 연도별 사용개수 업데이트
      await this.approvalRepository.updateLeaveAnnualUseCount(year, userIdx, leaveTypeIdx, manager);

      // 연도별 연차 총 사용량 업데이트
      if (ANNUAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx, manager);
      }
      // 연도별 특별휴무 총 사용량 업데이트
      if (SPECIAL_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalSpecialLeaveUsage(year, userIdx, manager);
      }
      // 연도별 대체휴무 총 사용량 업데이트
      if (ALTERNATIVE_LEAVE_LISTS.has(existing.leaveTypeIdx)) {
        await this.approvalRepository.updateTotalAlternativeLeaveUsage(year, userIdx, manager);
      }

      // 식대 월별 timeoffDays 업데이트
      await this.approvalRepository.updateMealTimeOffDays(year, month, userIdx, manager);
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
        };
      }),
    );

    return result;
  }
}
