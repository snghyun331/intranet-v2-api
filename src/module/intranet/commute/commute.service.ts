import { BadRequestException, Injectable } from '@nestjs/common';
import { CommuteRepository } from './repository/commute.repository';
import { StartWorkDto } from './dto/startWork.dto';
import { EntityManager } from 'typeorm';

@Injectable()
export class CommuteService {
  constructor(private readonly commuteRepository: CommuteRepository) {}

  async checkInWork(userIdx: number, startWorkInfo: StartWorkDto, manager: EntityManager): Promise<void> {
    // 오늘의 출근 정보가 있는지 확인
    const commuteCnt: number = await this.commuteRepository.getTodayCommuteCnt(userIdx, startWorkInfo.commuteDate);
    if (commuteCnt > 0) {
      throw new BadRequestException('이미 출근이 등록되었습니다.');
    }

    await this.commuteRepository.createWork(userIdx, startWorkInfo, manager);

    return;
  }
}
