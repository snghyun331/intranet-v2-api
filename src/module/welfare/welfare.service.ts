import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { WelfareInfoDto } from './dto/welfare.dto';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';

@Injectable()
export class WelfareService {
  constructor(private readonly welfareRepository: WelfareRepository) {}

  async createWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto) {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    if (newWelfareInfo.payerName) {
      const allUserNames: string[] = await this.welfareRepository.getAllUserNames();
      if (!allUserNames.includes(newWelfareInfo.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }

    const year: number = Number(newWelfareInfo.targetDay.substring(0, 4));
    const month: number = Number(newWelfareInfo.targetDay.substring(5, 7));

    await this.welfareRepository.createWelfare(userIdx, newWelfareInfo);

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);
  }

  async deleteWelfare(userIdx: number, welfareIdx: number): Promise<void> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const welfareInfo: WelfareInfoDto = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    const year: number = Number(welfareInfo.targetDay.substring(0, 4));
    const month: number = Number(welfareInfo.targetDay.substring(5, 7));

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 사용내역 삭제 권한이 없습니다');
    }

    await this.welfareRepository.deleteWelfare(welfareIdx);

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);
  }

  async updateWelfare(userIdx: number, welfareIdx: number, updateWelfareInfo: UpdateWelfareDto): Promise<void> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    if (updateWelfareInfo.payerName) {
      const allUserNames: string[] = await this.welfareRepository.getAllUserNames();
      if (!allUserNames.includes(updateWelfareInfo.payerName)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }

    const welfareInfo: WelfareInfoDto = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    if (!welfareInfo) {
      throw new NotFoundException('해당 사용내역은 존재하지 않거나 삭제되었습니다.');
    }
    const year: number = Number(welfareInfo.targetDay.substring(0, 4));
    const month: number = Number(welfareInfo.targetDay.substring(5, 7));

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('식대 수정 권한이 없습니다');
    }

    await this.welfareRepository.updateWelfare(welfareIdx, updateWelfareInfo);

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);
  }
}
