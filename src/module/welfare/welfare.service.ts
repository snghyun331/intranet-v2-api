import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { WelfareInfoDto } from './dto/welfare.dto';

@Injectable()
export class WelfareService {
  constructor(private readonly welfareRepository: WelfareRepository) {}

  async createWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto) {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    if (newWelfareInfo.payer) {
      const allUserNames: string[] = await this.welfareRepository.getAllUserNames();
      if (!allUserNames.includes(newWelfareInfo.payer)) {
        throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
      }
    }

    const year: number = Number(newWelfareInfo.useDate.substring(0, 4));
    const month: number = Number(newWelfareInfo.useDate.substring(5, 7));

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
    const year: number = Number(welfareInfo.useDate.substring(0, 4));
    const month: number = Number(welfareInfo.useDate.substring(5, 7));

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 사용내역 삭제 권한이 없습니다');
    }

    await this.welfareRepository.deleteWelfare(welfareIdx);

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);
  }
}
