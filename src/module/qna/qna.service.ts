import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQnaDto } from './dto/createQna.dto';
import { QnaRepository } from './repository/qna.repository';
import { EntityManager } from 'typeorm';
import { QnaEntity } from '../../entity/qna/qna.entity';
import { QnaAdminResult, QnaInfo } from './interface/result.interface';

@Injectable()
export class QnaService {
  constructor(private readonly qnaRepository: QnaRepository) {}

  async createQna(userIdx: number, newQnaInfo: CreateQnaDto, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.qnaRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    await this.qnaRepository.createQna(userIdx, newQnaInfo, manager);

    return;
  }

  async getMyQna(userIdx: number): Promise<QnaEntity[]> {
    const userCnt: number = await this.qnaRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const userQnaInfo: QnaEntity[] = await this.qnaRepository.getUserQna(userIdx);

    return userQnaInfo;
  }

  async getQna({ pageNo, perPage, ...filterInfo }) {
    const { totalPage, total, qna }: QnaAdminResult = await this.qnaRepository.getQna(pageNo, perPage, filterInfo);

    return { totalPage, total, qna };
  }

  async deleteMyQna(userIdx: number, qnaIdx: number, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.qnaRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    const qnaInfo: QnaInfo = await this.qnaRepository.getQnaInfoByIdx(qnaIdx);
    if (!qnaInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }

    if (userIdx !== qnaInfo.userIdx) {
      throw new ForbiddenException('문의내역 삭제 권한이 없습니다');
    }

    await this.qnaRepository.deleteMyQna(qnaIdx, manager);

    return;
  }
}
