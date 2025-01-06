import { BadRequestException, Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { EntityManager } from 'typeorm';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { NoticeAdminResult } from './interface/result.interface';
import { NoticeDetailInfo } from './interface/notice.interface';

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepostiory) {}

  async createNotice(noticeInfo: CreateNoticeDto, adminName: string, manager: EntityManager): Promise<void> {
    console.log(adminName);
    await this.noticeRepository.createNotice(noticeInfo, adminName, manager);

    return;
  }

  async getNoticeList({ pageNo, perPage }: PageNoDto): Promise<NoticeAdminResult> {
    const noticeList: NoticeAdminResult = await this.noticeRepository.getNoticeList(pageNo, perPage);

    return noticeList;
  }

  async getNoticeDetail(noticeIdx: number): Promise<NoticeDetailInfo> {
    const noticeCnt: number = await this.noticeRepository.getNoticeCnt(noticeIdx);
    if (noticeCnt < 1) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    const noticeDetail: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);

    return noticeDetail;
  }
}
