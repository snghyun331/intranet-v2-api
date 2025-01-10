import { Injectable } from '@nestjs/common';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '../../../entity/notice/notice.entity';
import { NoticeDetailInfo, NoticeInfo } from '../interface/notice.interface';
import { NoticeResult } from '../interface/result.interface';
import { UpdateNoticeDto } from '../dto/updateNotice.dto';

@Injectable()
export class NoticeRepostiory {
  constructor(@InjectRepository(NoticeEntity) private readonly noticeModel: Repository<NoticeEntity>) {}

  async createNotice(noticeInfo: CreateNoticeDto, adminName: string, manager: EntityManager): Promise<number> {
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(NoticeEntity)
      .values({ creatorName: adminName, lastEditorName: adminName, ...noticeInfo })
      .execute();

    const noticeIdx: number = result.identifiers[0].noticeIdx;

    return noticeIdx;
  }

  async updateNoticeImage(noticeIdx: number, imageUrl: string, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(NoticeEntity)
      .set({ imageUrl })
      .where('noticeIdx = :noticeIdx', { noticeIdx })
      .execute();
  }

  async updateNotice(
    adminName: string,
    noticeIdx: number,
    noticeInfo: UpdateNoticeDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(NoticeEntity)
      .set({ lastEditorName: adminName, ...noticeInfo })
      .where('noticeIdx = :noticeIdx', { noticeIdx })
      .execute();
  }

  async getNoticeList(pageNo: number, perPage: number): Promise<NoticeResult> {
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

  async deleteNotice(noticeIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(NoticeEntity)
      .where('noticeIdx = :noticeIdx', { noticeIdx })
      .execute();
  }
}
