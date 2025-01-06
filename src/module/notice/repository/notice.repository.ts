import { Injectable } from '@nestjs/common';
import { EntityManager, InsertResult, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '../../../entity/notice/notice.entity';
import { NoticeInfo } from '../interface/notice.dto';
import { NoticeAdminResult } from '../interface/result.interface';

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

  async getNoticeList(pageNo: number, perPage: number): Promise<NoticeAdminResult> {
    const query: SelectQueryBuilder<NoticeEntity> = this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.createdAt AS createdAt',
      ]);

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('noticeEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result: NoticeInfo[] = await query.getRawMany();

    return { totalPage, total, notices: result };
  }
}
