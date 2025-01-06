import { Injectable } from '@nestjs/common';
import { EntityManager, InsertResult, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '../../../entity/notice/notice.entity';
import { NoticeDetailInfo, NoticeInfo } from '../interface/notice.interface';
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

  async getNoticeByIdx(noticeIdx: number): Promise<NoticeDetailInfo> {
    const result: NoticeDetailInfo = await this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.content AS content',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.lastEditorName AS lastEditorName',
        'noticeEntity.imageUrl AS imageUrl',
        'noticeEntity.createdAt AS createdAt',
        'noticeEntity.updatedAt AS updatedAt',
      ])
      .where('noticeEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getRawOne();

    return result;
  }

  async getNoticeCnt(noticeIdx: number): Promise<number> {
    const noticeCnt: number = await this.noticeModel
      .createQueryBuilder('noticeEntity')
      .where('noticeEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getCount();

    return noticeCnt;
  }
}
