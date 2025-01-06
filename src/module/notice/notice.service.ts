import { Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { EntityManager } from 'typeorm';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { NoticeAdminResult } from './interface/result.interface';

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
}
