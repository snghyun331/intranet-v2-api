import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { WelfareRepository } from './repository/welfare.repository';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { HalfYearEnum, YNEnum } from '@common/constant/enum';
import { ConfirmEnum } from './enum/welfare.enum';
import { CreateWelfareBudgetDto } from './dto/createBudget.dto';
import { AdminWelfareBalanceFilterDto, AdminWelfareBudgetFilterDto, AdminWelfareFilterDto } from './dto/query.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { substringYearMonth } from '@common/utils/utility';
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
    const userName: string = await this.userRepository.getUserNameByIdx(userIdx);
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
    const userName: string = await this.userRepository.getUserNameByIdx(userIdx);
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
    const welfareStats = await this.welfareRepository.getWelfareStats(year, halfYear, userIdx);
    const welfareInfo = await this.welfareRepository.getUserHalfYearWelfares(year, halfYear, userIdx);

    // 데이터를 변환하여 payeeList를 추가
    const transformedResult = await Promise.all(
      welfareInfo.map(async (welfare) => {
        const welfareIdx: number = welfare.selfWrittenYN === YNEnum.YES ? welfare.welfareIdx : welfare.payerWelfareIdx;
        const payeeList = await this.welfareRepository.getWelfareFromPayerWelfareIdx(welfareIdx);

        return {
          welfareIdx: welfare.welfareIdx,
          userIdx: welfare.userIdx,
          targetDay: welfare.targetDay,
          content: welfare.content,
          amount: welfare.amount,
          payerName: welfare.payerName,
          selfWrittenYN: welfare.selfWrittenYN,
          confirmYN: welfare.confirmYN,
          payeeList: payeeList.length > 0 ? payeeList : [],
        };
      }),
    );

    const result = { welfareStats, welfares: transformedResult };

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

  /* 필터링 조건
   * 
  
  */
  async getWelfare({ pageNo, perPage }: PageNoDto, filterInfo: AdminWelfareFilterDto) {
    const { totalPage, total, result } = await this.welfareRepository.getWelfares(pageNo, perPage, filterInfo);

    let transformedResult: any[];
    const hasUserNameAndConfirmYN = filterInfo.userIdxs || filterInfo.confirmYN;
    const processedWelfareIdxs = new Set<number>();
    if (hasUserNameAndConfirmYN) {
      transformedResult = await Promise.all(
        result.map(async (welfare) => {
          if (welfare.selfWrittenYN === YNEnum.YES) {
            /* 동반결제정보 및 총 합산금액 추가 */
            const welfareIdx: number = welfare.welfareIdx;
            // 부모 내역이 중복된 내역이면, Null로 처리
            if (processedWelfareIdxs.has(welfare.welfareIdx)) {
              return null;
            }
            processedWelfareIdxs.add(welfare.welfareIdx);
            // welfareIdx를 payerWelfareIdx로 하는 모든 내역들 조회
            const payeeList = await this.welfareRepository.getWelfareFromPayerWelfareIdx(welfareIdx);
            const payeeTotalAmount: number = payeeList.reduce((sum, item) => sum + (item.amount ?? 0), 0); // 동반결제자 금액 합산
            const selfWriterAmount: number = welfare.amount ?? 0; // 결제자 금액
            const groupTotalAmount: number = selfWriterAmount + payeeTotalAmount;
            return {
              welfareIdx,
              userIdx: welfare.userIdx,
              userName: welfare.userName,
              teamName: welfare.teamName,
              gradeName: welfare.gradeName,
              targetDay: welfare.targetDay,
              content: welfare.content,
              amount: welfare.amount,
              payerName: welfare.payerName,
              payerWelfareIdx: welfare.payerWelfareIdx,
              confirmYN: welfare.confirmYN,
              tempConfirmDate: welfare.tempConfirmDate,
              confirmDate: welfare.confirmDate,
              selfWrittenYN: welfare.selfWrittenYN,
              note: welfare.note,
              groupTotalAmount,
              details: payeeList.length > 0 ? { payeeList } : null,
            };
          }
          if (welfare.selfWrittenYN === YNEnum.NO) {
            /* 동반결제정보 및 총 합산금액 추가 */
            const payerWelfareIdx: number = welfare.payerWelfareIdx;
            // welfareIdx = payerWelfareIdx에 해당하는 부모 내역 조회
            const parentWelfare = await this.welfareRepository.getParentWelfareByPayerWelfareIdx(payerWelfareIdx);
            // 부모 내역이 중복된 내역이면, Null로 처리
            if (processedWelfareIdxs.has(parentWelfare.welfareIdx)) {
              return null;
            }
            processedWelfareIdxs.add(parentWelfare.welfareIdx);
            // 해당 부모내역에 대한 자식 내역들 조회
            const payeeList = await this.welfareRepository.getWelfareFromPayerWelfareIdx(payerWelfareIdx);
            const payeeTotalAmount: number = payeeList.reduce((sum, item) => sum + (item.amount ?? 0), 0); // 동반결제자 금액 합산
            const selfWriterAmount: number = parentWelfare.amount ?? 0; // 결제자 금액
            const groupTotalAmount: number = selfWriterAmount + payeeTotalAmount;
            return {
              welfareIdx: parentWelfare.welfareIdx,
              userIdx: parentWelfare.userIdx,
              userName: parentWelfare.userName,
              teamName: parentWelfare.teamName,
              gradeName: parentWelfare.gradeName,
              targetDay: parentWelfare.targetDay,
              content: parentWelfare.content,
              amount: parentWelfare.amount,
              payerName: parentWelfare.payerName,
              payerWelfareIdx: parentWelfare.payerWelfareIdx,
              confirmYN: parentWelfare.confirmYN,
              tempConfirmDate: parentWelfare.tempConfirmDate,
              confirmDate: parentWelfare.confirmDate,
              selfWrittenYN: parentWelfare.selfWrittenYN,
              note: parentWelfare.note,
              groupTotalAmount,
              details: payeeList.length > 0 ? { payeeList } : null,
            };
          }
        }),
      );
    } else {
      const parentnWelfares = result.filter((welfare) => welfare.selfWrittenYN === YNEnum.YES);

      transformedResult = await Promise.all(
        parentnWelfares.map(async (welfare) => {
          /* 동반결제정보 및 총 합산금액 추가 */
          const welfareIdx: number = welfare.welfareIdx;
          // 부모 내역이 중복된 내역이면, Null로 처리
          if (processedWelfareIdxs.has(welfare.welfareIdx)) {
            return null;
          }
          processedWelfareIdxs.add(welfare.welfareIdx);
          // welfareIdx를 payerWelfareIdx로 하는 모든 내역들 조회
          const payeeList = await this.welfareRepository.getWelfareFromPayerWelfareIdx(welfareIdx);
          const payeeTotalAmount: number = payeeList.reduce((sum, item) => sum + (item.amount ?? 0), 0); // 동반결제자 금액 합산
          const selfWriterAmount: number = welfare.amount ?? 0; // 결제자 금액
          const groupTotalAmount: number = selfWriterAmount + payeeTotalAmount;
          return {
            welfareIdx,
            userIdx: welfare.userIdx,
            userName: welfare.userName,
            teamName: welfare.teamName,
            gradeName: welfare.gradeName,
            targetDay: welfare.targetDay,
            content: welfare.content,
            amount: welfare.amount,
            payerName: welfare.payerName,
            payerWelfareIdx: welfare.payerWelfareIdx,
            confirmYN: welfare.confirmYN,
            tempConfirmDate: welfare.tempConfirmDate,
            confirmDate: welfare.confirmDate,
            selfWrittenYN: welfare.selfWrittenYN,
            note: welfare.note,
            groupTotalAmount,
            details: payeeList.length > 0 ? { payeeList } : null,
          };
        }),
      );
    }

    // 중복 내역 처리로 인해 생긴 null 제거
    const filterdResult = transformedResult.filter((result) => result !== null);

    /* targetDay 내림차순 → userName 오름차순 정렬 */
    const finalResult = filterdResult.sort((a, b) => {
      const dateA = new Date(a.targetDay);
      const dateB = new Date(b.targetDay);

      // targetDay 내림차순
      const dateComparison = dateB.getTime() - dateA.getTime();

      // targetDay가 같으면, userName 오름차순
      if (dateComparison === 0) {
        return a.userName.localeCompare(b.userName);
      }

      return dateComparison;
    });

    return { totalPage, total, welfare: finalResult };
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

  @Transactional()
  async updateWelfareNote(welfareIdx: number, note: string): Promise<void> {
    await this.welfareRepository.updateWelfareNote(welfareIdx, note);
  }
}
