import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { EntityManager } from 'typeorm';
import { HalfYearEnum, YNEnum } from '../../common/constant/enum';
import {
  NewWelfareMonthStats,
  NewWelfareStats,
  WelfareInfo,
  Welfares,
  WelfareStats,
} from './interface/welfare.interface';
import { WelfareResult } from './interface/result.interface';
import { CreateWelfareBudgetDto } from './dto/createBudget.dto';

@Injectable()
export class WelfareService {
  constructor(private readonly welfareRepository: WelfareRepository) {}

  async createWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto, manager: EntityManager): Promise<string> {
    const currentUserInfo: { userName: string } = await this.welfareRepository.getUserNameByIdx(userIdx);
    if (!currentUserInfo) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { userName } = currentUserInfo;
    if (userName !== newWelfareInfo.payerName) {
      throw new BadRequestException('결제자는 본인 이름만 입력 가능합니다.');
    }

    const year: number = Number(newWelfareInfo.targetDay.substring(0, 4));
    const month: number = Number(newWelfareInfo.targetDay.substring(5, 7));
    const welfareIdx: number = await this.welfareRepository.createWelfare(userIdx, newWelfareInfo, manager);
    if (newWelfareInfo.payeeIdxs.length > 0) {
      await Promise.all(
        newWelfareInfo.payeeIdxs.map(async (payeeIdx) => {
          if (payeeIdx === userIdx) {
            throw new BadRequestException('동반 결제자에 본인을 선택할 수 없습니다.');
          }
          await this.welfareRepository.createPayee(welfareIdx, payeeIdx, newWelfareInfo, manager);
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

  async deleteWelfare(userIdx: number, welfareIdx: number, manager: EntityManager): Promise<string> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const welfareInfo: WelfareInfo = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    if (!welfareInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 삭제 권한이 없습니다');
    }

    const year: number = Number(welfareInfo.targetDay.substring(0, 4));
    const month: number = Number(welfareInfo.targetDay.substring(5, 7));

    // 대리 결제자 목록 불러오기
    const payeeIdxList: number[] = await this.welfareRepository.getUserIdxFromPayerWelfareIdx(welfareIdx);

    await this.welfareRepository.deleteWelfare(welfareIdx, manager);

    // 본인의 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx, manager);

    // 대리결제자의 복지포인트 사용금액 업데이트
    if (payeeIdxList.length > 0) {
      await Promise.all(
        payeeIdxList.map(async (payeeIdx) => {
          const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
            year,
            month,
            payeeIdx,
            manager,
          );
          await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, payeeIdx, manager);
        }),
      );
    }

    return welfareInfo.targetDay;
  }

  async updateWelfare(
    userIdx: number,
    welfareIdx: number,
    updateWelfareInfo: UpdateWelfareDto,
    manager: EntityManager,
  ): Promise<string> {
    const currentUserInfo: { userName: string } = await this.welfareRepository.getUserNameByIdx(userIdx);
    if (!currentUserInfo) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { userName } = currentUserInfo;
    if (updateWelfareInfo.selfWrittenYN === YNEnum.YES && userName !== updateWelfareInfo.payerName) {
      throw new BadRequestException('결제자는 본인 이름만 입력 가능합니다.');
    }

    const welfareInfo: WelfareInfo = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    if (!welfareInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 수정 권한이 없습니다');
    }

    const year: number = Number(welfareInfo.targetDay.substring(0, 4));
    const month: number = Number(welfareInfo.targetDay.substring(5, 7));

    // 본인 결제자의 내역 업데이트
    await this.welfareRepository.updateWelfare(welfareIdx, updateWelfareInfo, manager);
    // 대리 결제자 내역도 업데이트
    await this.welfareRepository.updatePayeeWelfare(welfareIdx, updateWelfareInfo, manager);

    /* payeeIdxs 처리 */
    if (updateWelfareInfo.selfWrittenYN === YNEnum.YES) {
      // 1. 기존 userIdx 목록 가져오기
      const payeeIdxList: number[] = await this.welfareRepository.getUserIdxFromPayerWelfareIdx(welfareIdx);
      // 2. 제거할 userIdx 목록 계산
      const payeeIdxToRemove: number[] = payeeIdxList.filter(
        (userIdx) => !updateWelfareInfo.payeeIdxs.includes(userIdx),
      );
      // 3. 새로 추가할 userIdx 목록 계산
      const payeeIdxToAdd: number[] = updateWelfareInfo.payeeIdxs.filter((userIdx) => !payeeIdxList.includes(userIdx));
      // 4. 삭제할 데이터 처리
      if (payeeIdxToRemove.length > 0) {
        await this.welfareRepository.deleteWelfareFromIdxAndUserIdx(welfareIdx, payeeIdxToRemove, manager);
      }
      // 5. 추가할 데이터 처리
      if (payeeIdxToAdd.length > 0) {
        await Promise.all(
          payeeIdxToAdd.map(async (payeeIdx) => {
            if (payeeIdx === userIdx) {
              throw new BadRequestException('동반 결제자에 본인을 선택할 수 없습니다.');
            }
            await this.welfareRepository.createPayee(welfareIdx, payeeIdx, updateWelfareInfo, manager);
          }),
        );
      }
    }

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(
      year,
      month,
      userIdx,
      manager,
    );
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx, manager);

    return updateWelfareInfo.targetDay;
  }

  async getWelfare(year: string, month: string[], userIdx: number): Promise<WelfareResult> {
    const userCnt: number = await this.welfareRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    let welfareInfo: Welfares[] = [];

    if (year && month) {
      const yearToNum: number = Number(year);
      welfareInfo = await this.welfareRepository.getMonthWelfares(yearToNum, month, userIdx);
    } else if (!year && !month) {
      welfareInfo = await this.welfareRepository.getAllWelfares(userIdx);
    } else {
      throw new BadRequestException('연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다');
    }
    const nowDate: Date = new Date();
    const nowYear: number = nowDate.getFullYear();
    const nowMonth: number = nowDate.getMonth() + 1;
    const halfYear: HalfYearEnum = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    const welfareStats: WelfareStats = await this.welfareRepository.getWelfareStats(nowYear, halfYear, userIdx);

    const result: WelfareResult = {
      welfareStats,
      welfares: welfareInfo,
    };

    return result;
  }

  async createWelfareBudget(welfareBudgetInfo: CreateWelfareBudgetDto, manager: EntityManager) {
    const date: Date = new Date();
    const year: number = date.getFullYear();
    const yearToString: string = year.toString();
    const halfYear: HalfYearEnum = welfareBudgetInfo.period;
    const welfareBudget: number = welfareBudgetInfo.welfareBudget;
    const userIdxList: number[] = await this.welfareRepository.getAllUserIdxExceptCEO();
    const welfareStatsCnt: number = await this.welfareRepository.getWelfareStatsCount(welfareBudgetInfo, year);

    /** 기록이 없다면 통계 create (기록이 있다면 통계 업데이트) **/
    if (welfareStatsCnt < 1) {
      /* 월별 통계 create */
      // 상반기일 경우
      if (welfareBudgetInfo.period === HalfYearEnum.H1) {
        for (let i = 1; i < 7; i++) {
          for (const userIdx of userIdxList) {
            const newWelfareMonthStatsInfo: NewWelfareMonthStats = {
              userIdx,
              year: yearToString,
              month: i.toString(),
              welfareMonthExpense: 0,
            };
            await this.welfareRepository.createWelfareMonthStats(newWelfareMonthStatsInfo, manager);
          }
        }
      } else {
        // 하반기일 경우
        for (let i = 7; i < 13; i++) {
          for (const userIdx of userIdxList) {
            const newWelfareMonthStatsInfo: NewWelfareMonthStats = {
              userIdx,
              year: yearToString,
              month: i.toString(),
              welfareMonthExpense: 0,
            };
            await this.welfareRepository.createWelfareMonthStats(newWelfareMonthStatsInfo, manager);
          }
        }
      }
      /* 반기별 통계 create */
      await Promise.all(
        userIdxList.map(async (userIdx) => {
          const newWelfareStatsInfo: NewWelfareStats = {
            userIdx,
            year: yearToString,
            halfYear,
            welfareBudget,
          };
          await this.welfareRepository.createWelfareStats(newWelfareStatsInfo, manager);
        }),
      );
    } else {
      // update
      const newWelfareStatsInfo: NewWelfareStats = {
        year: yearToString,
        halfYear,
        welfareBudget,
      };
      await this.welfareRepository.updateWelfareStats(newWelfareStatsInfo, manager);
    }
  }
}
