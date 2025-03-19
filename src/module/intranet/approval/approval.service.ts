import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalRepository } from './repository/approval.repository';
import { EntityManager } from 'typeorm';
import { ConfirmEnum } from '../../../common/constant/enum';
import { substringYearMonth } from '../../../common/utils/utility';

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
      await this.approvalRepository.updateTotalAnnualLeaveUsage(year, userIdx, manager);
    }
  }
}
