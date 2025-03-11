import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalRepository } from './repository/approval.repository';
import { EntityManager } from 'typeorm';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum } from '../../../common/constant/enum';

@Injectable()
export class ApprovalService {
  constructor(private readonly approvalRepository: ApprovalRepository) {}

  async confirmLeave(
    commuteIdx: number,
    userIdx: number,
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
    const existing = commuteInfoWithApprover.find((info: any) => info.approverIdx === userIdx);
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
    await this.approvalRepository.updateConfirm(commuteIdx, userIdx, confirmYN, manager);
    // /* 승인여부 업데이트에 따른 휴가 산정 변경 */
    // const year: string = existing.commuteDate.substring(0, 4);
    // const month: string = existing.commuteDate.substring(5, 7);
    // // 승인
    // if (confirmYN === ConfirmEnum.YES) {
    //   const leaveTypeIdx: number = existing.leaveTypeIdx;
    //   const usage: number = await this.approvalRepository.getTotalLeaveCountForMonth(
    //     year,
    //     month,
    //     userIdx,
    //     leaveTypeIdx,
    //   );
    // const updateField
    // switch (existing.leaveTypeIdx) {
    //   case IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE:
    //     await this.approvalRepository.updateFullLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.AM_HALF:
    //     await this.approvalRepository.updateAMHalfLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.PM_HALF:
    //     await this.approvalRepository.updatePMHalfLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.AM_QUARTER:
    //     await this.approvalRepository.updateAMQuarterLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.PM_QUARTER:
    //     await this.approvalRepository.updatePMQuarterLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE:
    //     await this.approvalRepository.updateSpecialLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE:
    //     await this.approvalRepository.updateSpecialLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    //   case IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE:
    //     await this.approvalRepository.updateSpecialLeaveUsageForMonth(year, month, userIdx, usage);
    //     break;
    // }
  }
  // 반려
}
