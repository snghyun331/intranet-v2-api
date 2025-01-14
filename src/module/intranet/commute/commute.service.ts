import { BadRequestException, Injectable } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { CheckInDto } from './dto/checkIn.dto';
import { EntityManager } from 'typeorm';
import { CheckOutDto } from './dto/checkOut.dto';
import { DEFAULT_WORK_HOURS } from '../../../common/constant/constant';

@Injectable()
export class CommuteService {
  constructor(private readonly commuteRepository: CommuteRepository) {}

  async checkInWork(userIdx: number, checkInDto: CheckInDto, logIp: string, manager: EntityManager): Promise<void> {
    // 오늘의 출근 정보가 있는지 확인
    const commuteCnt: number = await this.commuteRepository.getTodayCommuteCnt(userIdx, checkInDto.commuteDate);
    if (commuteCnt > 0) {
      throw new BadRequestException('이미 출근이 등록되었습니다.');
    }

    await this.commuteRepository.checkInWork(userIdx, checkInDto, logIp, manager);

    return;
  }

  async checkOutWork(userIdx: number, checkOutDto: CheckOutDto, logIp: string, manager: EntityManager): Promise<void> {
    /* 오늘의 출근 정보가 있는지 확인 */
    const todayCommuteInfo: { checkInTime: Date } = await this.commuteRepository.getTodayCommuteInfo(
      userIdx,
      checkOutDto.commuteDate,
    );
    if (!todayCommuteInfo) {
      throw new BadRequestException('출근을 먼저 등록해주세요');
    }
    /* 근무시간이 9시간 미만이면 사유를 필수 입력 */
    // const checkOutTime: Date = new Date(checkOutDto.checkOutTime);
    // const checkInTime: Date = new Date(todayCommuteInfo.checkInTime);
    // const workHours: number = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    if (checkOutDto.workHours < DEFAULT_WORK_HOURS && !checkOutDto.earlyLeaveReason) {
      throw new BadRequestException('근무시간이 9시간 미만일 경우, 조기 퇴근 사유이 필수입니다.');
    }

    await this.commuteRepository.checkOutWork(userIdx, checkOutDto, logIp, manager);

    return;
  }
}
