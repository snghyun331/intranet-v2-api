import { Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { EntityManager } from 'typeorm';

@Injectable()
export class NoticeService {
  constructor(private readonly noticeRepository: NoticeRepostiory) {}

  async createNotice(noticeInfo: CreateNoticeDto, adminName: string, manager: EntityManager): Promise<void> {
    await this.noticeRepository.createNotice(noticeInfo, adminName, manager);

    return;
  }
}
