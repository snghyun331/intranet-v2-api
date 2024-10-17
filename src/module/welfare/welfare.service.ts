import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { GetWelfareDto, WelfareInfoDto, WelfareStatsDto } from './dto/welfare.dto';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { EntityManager } from 'typeorm';
import { WelfareEntity } from '../../entity/welfare/welfare.entity';
import { HalfYearEnum } from '../../common/constant/enum';

@Injectable()
export class WelfareService {
  constructor(private readonly welfareRepository: WelfareRepository) {}

  async createWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const allUserNames: string[] = await this.welfareRepository.getAllUserNames();
    if (!allUserNames.includes(newWelfareInfo.payerName)) {
      throw new BadRequestException('잘못된 결제자를 입력하였습니다.');
    }

    const year: number = Number(newWelfareInfo.targetDay.substring(0, 4));
    const month: number = Number(newWelfareInfo.targetDay.substring(5, 7));
    const welfareIdx: number = await this.welfareRepository.createWelfare(userIdx, newWelfareInfo, manager);
    if (newWelfareInfo.payeerIdxs.length > 0) {
      await Promise.all(
        newWelfareInfo.payeerIdxs.map(async (payeerIdx) => {
          await this.welfareRepository.createPayeer(welfareIdx, payeerIdx, manager);
        }),
      );
    }

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx, manager);

    return newWelfareInfo.targetDay;
  }

  async deleteWelfare(userIdx: number, welfareIdx: number, manager: EntityManager): Promise<void> {
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
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx, manager);
  }

  async updateWelfare(
    userIdx: number,
    welfareIdx: number,
    updateWelfareInfo: UpdateWelfareDto,
    manager: EntityManager,
  ): Promise<void> {
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
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx, manager);
  }

  async getWelfare(year: string, month: string, userIdx: number): Promise<GetWelfareDto> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    let welfareInfo: WelfareEntity[] = [];
    if (year && month) {
      const yearToNum: number = Number(year);
      const monthToNum: number = Number(month);
      welfareInfo = await this.welfareRepository.getMonthWelfares(yearToNum, monthToNum, userIdx);
    } else if (!year && !month) {
      welfareInfo = await this.welfareRepository.getAllWelfares(userIdx);
    } else {
      throw new BadRequestException('연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다');
    }
    const nowDate: Date = new Date();
    const nowYear: number = nowDate.getFullYear();
    const nowMonth: number = nowDate.getMonth() + 1;
    const halfYear: HalfYearEnum = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    const welfareStats: WelfareStatsDto = await this.welfareRepository.getWelfareStats(nowYear, halfYear, userIdx);

    const result: GetWelfareDto = {
      welfareStats,
      welfares: welfareInfo,
    };

    return result;
  }
}
