import { Injectable } from '@nestjs/common';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '../../../entity/notice/notice.entity';

@Injectable()
export class NoticeRepostiory {
  constructor(@InjectRepository(NoticeEntity) private readonly noticeModel: Repository<NoticeEntity>) {}

  async createNotice(noticeInfo: CreateNoticeDto, adminName: string, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(NoticeEntity)
      .values({ creatorName: adminName, lastEditorName: adminName, ...noticeInfo })
      .execute();
  }
}
