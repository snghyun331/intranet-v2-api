import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { ConfirmEnum, HalfYearEnum, YNEnum } from '../../common/constant/enum';
import { CreateWelfareBudgetDto } from './dto/createBudget.dto';
import { AdminWelfareBalanceFilterDto, AdminWelfareBudgetFilterDto, AdminWelfareFilterDto } from './dto/query.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { substringYearMonth } from '../../common/utils/utility';
import { Transactional } from 'typeorm-transactional';
import { NewWelfareMonthStats, NewWelfareStats } from './interface';
import { GlobalUserRepository } from '../global/repository/globalUser.repository';
import * as moment from 'moment';

@Injectable()
export class WelfareService {
  constructor(
    private readonly welfareRepository: WelfareRepository,
    private readonly userRepository: GlobalUserRepository,
  ) {}

  @Transactional()
  async createMyWelfare(userIdx: number, newWelfareInfo: CreateWelfareDto): Promise<string> {
    const currentUserInfo: { userName: string } = await this.userRepository.getUserNameByIdx(userIdx);
    if (!currentUserInfo) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { userName } = currentUserInfo;
    if (userName !== newWelfareInfo.payerName) {
      throw new BadRequestException('결제자는 본인 이름만 입력 가능합니다.');
    }

    const { year, month } = substringYearMonth(newWelfareInfo.targetDay);

    const statsCnt: number = await this.welfareRepository.getWelfareMonthStatsCnt(userIdx, year, month);
    if (statsCnt < 1) {
      throw new BadRequestException('아직 복포를 작성할 수 없습니다.');
    }

    const welfareIdx: number = await this.welfareRepository.createWelfare(userIdx, newWelfareInfo);
    if (newWelfareInfo.payeeIdxs.length > 0) {
      for (const payeeIdx of newWelfareInfo.payeeIdxs) {
        if (payeeIdx === userIdx) {
          throw new BadRequestException('동반 결제자에 본인을 선택할 수 없습니다.');
        }
        await this.welfareRepository.createPayee(welfareIdx, payeeIdx, newWelfareInfo);
      }
    }

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month.toString(), userIdx);

    // 복지포인트 반기별 사용금액 업데이트
    await this.welfareRepository.updateWelfareExpense(year, month, userIdx);

    return newWelfareInfo.targetDay;
  }

  @Transactional()
  async deleteMyWelfare(userIdx: number, welfareIdx: number): Promise<string> {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const welfareInfo = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    if (!welfareInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 삭제 권한이 없습니다');
    }

    const { year, month } = substringYearMonth(welfareInfo.targetDay);

    // 동반 결제자 목록 불러오기
    const payeeIdxList: number[] = await this.welfareRepository.getUserIdxFromPayerWelfareIdx(welfareIdx);

    await this.welfareRepository.deleteWelfare(welfareIdx);

    // 본인의 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);

    // 본인의 복지포인트 반기별 사용금액 업데이트
    await this.welfareRepository.updateWelfareExpense(year, month, userIdx);

    if (payeeIdxList.length > 0) {
      for (const payeeIdx of payeeIdxList) {
        const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, payeeIdx);
        // 동반결제자의 복지포인트 월별 사용금액 업데이트
        await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, payeeIdx);

        // 동반 결제자의 복지포인트 반기별 사용금액 업데이트
        await this.welfareRepository.updateWelfareExpense(year, month, payeeIdx);
      }
    }

    return welfareInfo.targetDay;
  }

  @Transactional()
  async updateMyWelfare(userIdx: number, welfareIdx: number, updateWelfareInfo: UpdateWelfareDto): Promise<string> {
    const currentUserInfo: { userName: string } = await this.userRepository.getUserNameByIdx(userIdx);
    if (!currentUserInfo) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const { userName } = currentUserInfo;
    if (updateWelfareInfo.selfWrittenYN === YNEnum.YES && userName !== updateWelfareInfo.payerName) {
      throw new BadRequestException('결제자는 본인 이름만 입력 가능합니다.');
    }

    const welfareInfo = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
    if (!welfareInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (userIdx !== welfareInfo.userIdx) {
      throw new ForbiddenException('복포 수정 권한이 없습니다');
    }

    const { year, month } = substringYearMonth(welfareInfo.targetDay);

    // 본인 결제자의 내역 업데이트
    await this.welfareRepository.updateWelfare(welfareIdx, updateWelfareInfo);
    // 동반 결제자 내역도 업데이트
    await this.welfareRepository.updatePayeeWelfare(welfareIdx, updateWelfareInfo);

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
        await this.welfareRepository.deleteWelfareFromIdxAndUserIdx(welfareIdx, payeeIdxToRemove);
      }
      // 5. 추가할 데이터 처리
      if (payeeIdxToAdd.length > 0) {
        for (const payeeIdx of payeeIdxToAdd) {
          if (payeeIdx === userIdx) {
            throw new BadRequestException('동반 결제자에 본인을 선택할 수 없습니다.');
          }
          await this.welfareRepository.createPayee(welfareIdx, payeeIdx, updateWelfareInfo);
        }
      }
    }

    // 복지포인트 사용금액 업데이트
    const welfareMonthExpense: number = await this.welfareRepository.getTotalWelfareExpense(year, month, userIdx);
    await this.welfareRepository.updateMonthlyWelfareStats(welfareMonthExpense, year, month, userIdx);

    // 복지포인트 반기별 사용금액 업데이트
    await this.welfareRepository.updateWelfareExpense(year, month, userIdx);

    return updateWelfareInfo.targetDay;
  }

  async getMyWelfare(year: string, halfYear: HalfYearEnum, userIdx: number) {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const welfareInfo = await this.welfareRepository.getUserHalfYearWelfares(year, halfYear, userIdx);
    const welfareStats = await this.welfareRepository.getWelfareStats(year, halfYear, userIdx);

    const result = { welfareStats, welfares: welfareInfo };

    return result;
  }

  @Transactional()
  async createWelfareBudget(welfareBudgetInfo: CreateWelfareBudgetDto) {
    const { year, period: halfYear, welfareBudget } = welfareBudgetInfo;
    const userIdxList: number[] = await this.userRepository.getAllUserIdxExceptCEO();
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
              year,
              month: i.toString(),
              welfareMonthExpense: 0,
            };
            await this.welfareRepository.createWelfareMonthStats(newWelfareMonthStatsInfo);
          }
        }
      } else {
        // 하반기일 경우
        for (let i = 7; i < 13; i++) {
          for (const userIdx of userIdxList) {
            const newWelfareMonthStatsInfo: NewWelfareMonthStats = {
              userIdx,
              year,
              month: i.toString(),
              welfareMonthExpense: 0,
            };
            await this.welfareRepository.createWelfareMonthStats(newWelfareMonthStatsInfo);
          }
        }
      }
      /* 반기별 통계 create */
      for (const userIdx of userIdxList) {
        const newWelfareStatsInfo: NewWelfareStats = {
          userIdx,
          year,
          halfYear,
          welfareBudget,
        };
        await this.welfareRepository.createWelfareStats(newWelfareStatsInfo);
      }
    } else {
      // update
      const newWelfareStatsInfo: NewWelfareStats = {
        year,
        halfYear,
        welfareBudget,
      };
      await this.welfareRepository.updateWelfareStats(newWelfareStatsInfo);
    }

    return;
  }

  @Transactional()
  async updateWelfareBudget(welfareStatsIdx: number, welfareBudget: number): Promise<void> {
    const welfareStatsCnt: number = await this.welfareRepository.getWelfareStatsCountByIdx(welfareStatsIdx);
    if (welfareStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.welfareRepository.updateWelfareBudget(welfareStatsIdx, welfareBudget);

    return;
  }

  async getWelfareBudget(filterInfo: AdminWelfareBudgetFilterDto) {
    const today = moment().utcOffset(9);
    const year: string = today.year().toString();

    let halfYear: HalfYearEnum;
    if (!filterInfo.halfYear) {
      const nowMonth: number = today.month() + 1;
      halfYear = nowMonth >= 7 ? HalfYearEnum.H2 : HalfYearEnum.H1;
    } else {
      halfYear = filterInfo.halfYear;
    }

    const result = await this.welfareRepository.getAdminWelfareBudget(year, halfYear);

    return result;
  }

  @Transactional()
  async updateWelfareStatsNote(welfareStatsIdx: number, noteInfo: UpdateNoteDto): Promise<void> {
    const welfareStatsCnt: number = await this.welfareRepository.getWelfareStatsCountByIdx(welfareStatsIdx);
    if (welfareStatsCnt < 1) {
      throw new NotFoundException('존재하지 않는 통계 내역입니다.');
    }
    await this.welfareRepository.updateWelfareStatsNote(welfareStatsIdx, noteInfo);

    return;
  }

  async getWelfare({ pageNo, perPage }: PageNoDto, filterInfo: AdminWelfareFilterDto) {
    const { totalPage, total, welfare } = await this.welfareRepository.getWelfare(pageNo, perPage, filterInfo);

    return { totalPage, total, welfare };
  }

  @Transactional()
  async updateConfirmWelfare(welfareIdxList: number[], confirmYN: ConfirmEnum): Promise<void> {
    for (const welfareIdx of welfareIdxList) {
      const welfareInfo = await this.welfareRepository.getWelfareInfoByIdx(welfareIdx);
      if (!welfareInfo) {
        throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
      }
      await this.welfareRepository.updateConfirmWelfare(welfareIdx, confirmYN);
    }

    return;
  }

  async getUserWelfareStats({ year, halfYear }: AdminWelfareBalanceFilterDto) {
    const result = await this.welfareRepository.getUserWelfareStats(year, halfYear);

    return result;
  }

  @Transactional()
  async updateClearStatusComplete(welfareStatsIdxList: number[]): Promise<void> {
    for (const welfareStatsIdx of welfareStatsIdxList) {
      const welfareStatsCnt: number = await this.welfareRepository.getWelfareStatsCountByIdx(welfareStatsIdx);
      if (welfareStatsCnt < 1) {
        throw new NotFoundException('존재하지 않는 통계 내역입니다.');
      }
      await this.welfareRepository.updateClearStatusComplete(welfareStatsIdx);
    }
  }

  @Transactional()
  async updateClearStatusNotYet(welfareStatsIdxList: number[]): Promise<void> {
    for (const welfareStatsIdx of welfareStatsIdxList) {
      const welfareStatsCnt: number = await this.welfareRepository.getWelfareStatsCountByIdx(welfareStatsIdx);
      if (welfareStatsCnt < 1) {
        throw new NotFoundException('존재하지 않는 통계 내역입니다.');
      }
      await this.welfareRepository.updateClearStatusNotYet(welfareStatsIdx);
    }
  }
}
