import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQnaDto } from './dto/createQna.dto';
import { QnaRepository } from './repository/qna.repository';
import { EntityManager } from 'typeorm';
import { QnaEntity } from '../../entity/qna/qna.entity';
import { QnaAdminResult } from './interface/result.interface';
import { AdminPayload } from '../../common/interface/payload.interface';
import { ReplyQnaDto } from './dto/replyQna.dto';
import { YNEnum } from '../../common/constant/enum';
import { QnaInfo } from './interface/qna.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { QnaFilterDto } from './dto/query.dto';

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

  async getQna({ pageNo, perPage }: PageNoDto, filterInfo: QnaFilterDto) {
    const { totalPage, total, qna }: QnaAdminResult = await this.qnaRepository.getQna(pageNo, perPage, filterInfo);

    return { totalPage, total, qna };
  }

  async deleteMyQna(userIdx: number, qnaIdxList: number[], manager: EntityManager): Promise<void> {
    const userCnt: number = await this.qnaRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    for (const qnaIdx of qnaIdxList) {
      const qnaInfo: QnaInfo = await this.qnaRepository.getQnaInfoByIdx(qnaIdx);
      if (!qnaInfo) {
        throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
      }
      await this.qnaRepository.deleteMyQna(qnaIdx, manager);
    }

    return;
  }

  async replyQna(
    qnaIdx: number,
    { replyText }: ReplyQnaDto,
    admin: AdminPayload,
    manager: EntityManager,
  ): Promise<void> {
    const qnaInfo: QnaInfo = await this.qnaRepository.getQnaInfoByIdx(qnaIdx);
    if (!qnaInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    if (qnaInfo.replySuccessYN === YNEnum.YES) {
      throw new BadRequestException('이미 답변하였습니다.');
    }

    await this.qnaRepository.replyQna(qnaIdx, replyText, admin.adminName, manager);

    return;
  }

  async updateReply(
    qnaIdx: number,
    { replyText }: ReplyQnaDto,
    admin: AdminPayload,
    manager: EntityManager,
  ): Promise<void> {
    const qnaInfo: QnaInfo = await this.qnaRepository.getQnaInfoByIdx(qnaIdx);
    if (!qnaInfo) {
      throw new NotFoundException('해당 내역은 존재하지 않거나 삭제되었습니다.');
    }
    if (qnaInfo.replySuccessYN === YNEnum.NO) {
      throw new BadRequestException('아직 답변이 없습니다.');
    }

    await this.qnaRepository.updateReply(qnaIdx, replyText, admin.adminName, manager);
  }
}
