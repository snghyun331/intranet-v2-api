import { Injectable } from '@nestjs/common';
import { Brackets, DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '../../../entity/notice/notice.entity';
import { UpdateNoticeDto } from '../dto/updateNotice.dto';
import { ImageEntity } from '../../../entity/image/image.entity';
import { NoticeHasImageEntity } from '../../../entity/image/noticeHasImage.entity';
import { NoticeImageInfo } from '../interface/notice.interface';
import { AdminNoticeFilterDto } from '../dto/query.dto';

@Injectable()
export class NoticeRepostiory {
  constructor(
    @InjectRepository(NoticeEntity) private readonly noticeModel: Repository<NoticeEntity>,
    @InjectRepository(ImageEntity) private readonly imageModel: Repository<ImageEntity>,
    @InjectRepository(NoticeHasImageEntity) private readonly noticeImageModel: Repository<NoticeHasImageEntity>,
  ) {}

  async createNotice(noticeInfo: CreateNoticeDto, adminName: string): Promise<number> {
    const result: InsertResult = await this.noticeModel
      .createQueryBuilder()
      .insert()
      .into(NoticeEntity)
      .values({ creatorName: adminName, lastEditorName: adminName, ...noticeInfo })
      .execute();

    const noticeIdx: number = result.identifiers[0].noticeIdx;

    return noticeIdx;
  }

  async createNoticeImage(noticeIdx: number, imageInfo: NoticeImageInfo): Promise<void> {
    /* image entity */
    const result: InsertResult = await this.imageModel
      .createQueryBuilder()
      .insert()
      .into(ImageEntity)
      .values(imageInfo)
      .execute();

    const imageIdx: number = result.identifiers[0].imageIdx;

    /* notice_has_image entity */
    await this.noticeImageModel
      .createQueryBuilder()
      .insert()
      .into(NoticeHasImageEntity)
      .values({ noticeIdx, imageIdx })
      .execute();
  }

  async updateNoticeImage(imageIdx: number, imageInfo: NoticeImageInfo): Promise<UpdateResult> {
    return await this.imageModel
      .createQueryBuilder()
      .update(ImageEntity)
      .set(imageInfo)
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();
  }

  async updateNotice(adminName: string, noticeIdx: number, { title, content }: UpdateNoticeDto): Promise<UpdateResult> {
    return await this.noticeModel
      .createQueryBuilder()
      .update(NoticeEntity)
      .set({ lastEditorName: adminName, title, content })
      .where('noticeIdx = :noticeIdx', { noticeIdx })
      .execute();
  }

  async updateImageDataToNull(imageIdx: number): Promise<UpdateResult> {
    return await this.imageModel
      .createQueryBuilder()
      .update(ImageEntity)
      .set({ imageUrl: null, imageSize: null, imageName: null })
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();
  }

  async getNoticeList(pageNo: number, perPage: number, filterInfo?: AdminNoticeFilterDto) {
    const query: SelectQueryBuilder<NoticeEntity> = this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.createdAt AS createdAt',
      ]);

    if (filterInfo?.searchWord) {
      const searchWord: string = filterInfo.searchWord;
      query.where(
        new Brackets((qb) => {
          qb.where('noticeEntity.title LIKE :searchWord', { searchWord: `%${searchWord}%` }).orWhere(
            'noticeEntity.content LIKE :searchWord',
            { searchWord: `%${searchWord}%` },
          );
        }),
      );
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('noticeEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    return { totalPage, total, notices: result };
  }

  async getNoticeByIdx(noticeIdx: number) {
    const result = await this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.content AS content',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.lastEditorName AS lastEditorName',
        'noticeImageEntity.imageIdx AS imageIdx',
        'imageEntity.imageName AS imageName',
        'imageEntity.imageSize AS imageSize',
        'imageEntity.imageUrl AS imageUrl',
        'noticeEntity.createdAt AS createdAt',
        'noticeEntity.updatedAt AS updatedAt',
      ])
      .leftJoin(NoticeHasImageEntity, 'noticeImageEntity', 'noticeImageEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = noticeImageEntity.imageIdx')
      .where('noticeEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getRawOne();

    return result;
  }

  async deleteNotice(noticeIdx: number): Promise<DeleteResult> {
    return await this.noticeModel
      .createQueryBuilder()
      .delete()
      .from(NoticeEntity)
      .where('noticeIdx = :noticeIdx', { noticeIdx })
      .execute();
  }

  async deleteNoticeImage(imageIdx: number): Promise<DeleteResult> {
    return await this.imageModel
      .createQueryBuilder()
      .delete()
      .from(ImageEntity)
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();
  }
}
