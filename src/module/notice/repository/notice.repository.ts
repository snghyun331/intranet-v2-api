import { Injectable } from '@nestjs/common';
import { Brackets, DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CreateNoticeDto } from '../dto/createNotice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { NoticeEntity } from '@entity/notice/notice.entity';
import { UpdateNoticeDto } from '../dto/updateNotice.dto';
import { ImageEntity } from '@entity/image/image.entity';
import { NoticeHasImageEntity } from '@entity/image/noticeHasImage.entity';
import { NoticeImageInfo } from '../interface/notice.interface';
import { AdminNoticeFilterDto, UserNoticeFilterDto } from '../dto/query.dto';
import { NoticeReadLogEntity } from '@/entity/notice/noticeReadLog.entity';
import { getStartAndEndDateByMonth } from '@common/utils/utility';
import { NoticeCategoryEnum } from '../constant/enum';
import { NoticeAttendeeEntity } from '@entity/notice/noticeAttendee.entity';
import { NoticeCCUserEntity } from '@entity/notice/noticeCCUser.entity';
import { UserEntity } from '../../../entity/user/user.entity';

@Injectable()
export class NoticeRepostiory {
  constructor(
    @InjectRepository(NoticeEntity) private readonly noticeModel: Repository<NoticeEntity>,
    @InjectRepository(ImageEntity) private readonly imageModel: Repository<ImageEntity>,
    @InjectRepository(NoticeHasImageEntity) private readonly noticeImageModel: Repository<NoticeHasImageEntity>,
    @InjectRepository(NoticeReadLogEntity) private readonly noticeReadLogModel: Repository<NoticeReadLogEntity>,
    @InjectRepository(NoticeAttendeeEntity) private readonly noticeAttendeeModel: Repository<NoticeAttendeeEntity>,
    @InjectRepository(NoticeCCUserEntity) private readonly noticeCCUserModel: Repository<NoticeCCUserEntity>,
  ) {}

  async createNotice(noticeInfo: CreateNoticeDto, writerName: string): Promise<number> {
    const result: InsertResult = await this.noticeModel
      .createQueryBuilder()
      .insert()
      .into(NoticeEntity)
      .values({ creatorName: writerName, lastEditorName: writerName, ...noticeInfo })
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

  async getNoticeListForUser(pageNo: number, perPage: number, filterInfo: UserNoticeFilterDto, userIdx: number) {
    const query: SelectQueryBuilder<NoticeEntity> = this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.place AS place',
        'noticeEntity.useCar AS useCar',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.category AS category',
        'noticeEntity.startDate AS startDate',
        'noticeEntity.endDate AS endDate',
        'noticeEntity.createdAt AS createdAt',

        // 추가: 참석자 정보 가져오기
        'noticeAttendeeEntity.attendeeUserIdx AS attendeeUserIdx',
        'attendeeUserEntity.userName AS attendeeUserName',

        // 추가: 참조자 정보 가져오기
        'noticeCCUserEntity.ccUserIdx AS ccUserIdx',
        'ccUserEntity.userName AS ccUserName',
      ])
      .leftJoin(NoticeCCUserEntity, 'noticeCCUserEntity', 'noticeCCUserEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = noticeCCUserEntity.ccUserIdx')
      .leftJoin(NoticeAttendeeEntity, 'noticeAttendeeEntity', 'noticeAttendeeEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'attendeeUserEntity', 'attendeeUserEntity.userIdx = noticeAttendeeEntity.attendeeUserIdx')
      .leftJoin(
        NoticeReadLogEntity,
        'noticeReadLogEntity',
        'noticeEntity.noticeIdx = noticeReadLogEntity.noticeIdx AND noticeReadLogEntity.userIdx = :userIdx',
      )
      .addSelect('CASE WHEN noticeReadLogEntity.noticeIdx IS NULL THEN 1 ELSE 0 END AS isNew')
      .setParameter('userIdx', userIdx);

    if (filterInfo?.month && filterInfo?.year) {
      const year: string = filterInfo.year;
      const month: string = filterInfo.month;
      const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
      const monthStartDate: string = firstDayOfMonth.format('YYYY-MM-DD');
      const monthEndDate: string = lastDayOfMonth.format('YYYY-MM-DD');

      // 공지사항의 게시 기간이 해당 월에 일부라도 겹치는 경우를 찾음
      // (공지 시작일 <= 월 마지막날) && (공지 종료일 >= 월 첫날)
      query.andWhere('(noticeEntity.startDate <= :monthEndDate AND noticeEntity.endDate >= :monthStartDate)', {
        monthStartDate,
        monthEndDate,
      });
    }

    if (filterInfo?.category) {
      query.andWhere('noticeEntity.category IN (:...category)', { category: filterInfo.category });
    }

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
      .orderBy('noticeEntity.startDate', 'DESC')
      .addOrderBy('noticeEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    return { totalPage, total, notices: result };
  }

  async getNoticeListForAdmin(pageNo: number, perPage: number, filterInfo: AdminNoticeFilterDto) {
    const query: SelectQueryBuilder<NoticeEntity> = this.noticeModel
      .createQueryBuilder('noticeEntity')
      .select([
        'noticeEntity.noticeIdx AS noticeIdx',
        'noticeEntity.title AS title',
        'noticeEntity.place AS place',
        'noticeEntity.useCar AS useCar',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.category AS category',
        'noticeEntity.startDate AS startDate',
        'noticeEntity.endDate AS endDate',
        'noticeEntity.createdAt AS createdAt',

        // 추가: 참석자 정보 가져오기
        'noticeAttendeeEntity.attendeeUserIdx AS attendeeUserIdx',
        'attendeeUserEntity.userName AS attendeeUserName',

        // 추가: 참조자 정보 가져오기
        'noticeCCUserEntity.ccUserIdx AS ccUserIdx',
        'ccUserEntity.userName AS ccUserName',
      ])
      .leftJoin(NoticeCCUserEntity, 'noticeCCUserEntity', 'noticeCCUserEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = noticeCCUserEntity.ccUserIdx')
      .leftJoin(NoticeAttendeeEntity, 'noticeAttendeeEntity', 'noticeAttendeeEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'attendeeUserEntity', 'attendeeUserEntity.userIdx = noticeAttendeeEntity.attendeeUserIdx');

    if (filterInfo?.month && filterInfo?.year) {
      const year: string = filterInfo.year;
      const month: string = filterInfo.month;
      const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
      const monthStartDate: string = firstDayOfMonth.format('YYYY-MM-DD');
      const monthEndDate: string = lastDayOfMonth.format('YYYY-MM-DD');

      // 공지사항의 게시 기간이 해당 월에 일부라도 겹치는 경우를 찾음
      // (공지 시작일 <= 월 마지막날) && (공지 종료일 >= 월 첫날)
      query.andWhere('(noticeEntity.startDate <= :monthEndDate AND noticeEntity.endDate >= :monthStartDate)', {
        monthStartDate,
        monthEndDate,
      });
    }

    if (filterInfo?.category) {
      query.andWhere('noticeEntity.category IN (:...category)', { category: filterInfo.category });
    }

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
      .orderBy('noticeEntity.startDate', 'DESC')
      .addOrderBy('noticeEntity.createdAt', 'DESC')
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
        'noticeEntity.category AS category',
        'noticeEntity.place AS place',
        'noticeEntity.useCar AS useCar',
        'noticeEntity.startDate AS startDate',
        'noticeEntity.endDate AS endDate',
        'noticeEntity.creatorName AS creatorName',
        'noticeEntity.lastEditorName AS lastEditorName',
        'noticeImageEntity.imageIdx AS imageIdx',
        'imageEntity.imageName AS imageName',
        'imageEntity.imageSize AS imageSize',
        'imageEntity.imageUrl AS imageUrl',
        'noticeEntity.createdAt AS createdAt',
        'noticeEntity.updatedAt AS updatedAt',

        // 추가: 참석자 정보 가져오기
        'noticeAttendeeEntity.attendeeUserIdx AS attendeeUserIdx',
        'attendeeUserEntity.userName AS attendeeUserName',

        // 추가: 참조자 정보 가져오기
        'noticeCCUserEntity.ccUserIdx AS ccUserIdx',
        'ccUserEntity.userName AS ccUserName',
      ])
      .leftJoin(NoticeCCUserEntity, 'noticeCCUserEntity', 'noticeCCUserEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = noticeCCUserEntity.ccUserIdx')
      .leftJoin(NoticeAttendeeEntity, 'noticeAttendeeEntity', 'noticeAttendeeEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'attendeeUserEntity', 'attendeeUserEntity.userIdx = noticeAttendeeEntity.attendeeUserIdx')
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

  async updateLastNoticeCheckedAt(noticeIdx: number, userIdx: number): Promise<void> {
    await this.noticeReadLogModel.save({
      noticeIdx,
      userIdx,
      lastCheckedAt: new Date(),
    });

    return;
  }

  async getNewNoticeCount(userIdx: number): Promise<number> {
    const subQuery: string = this.noticeReadLogModel
      .createQueryBuilder('noticeReadLogEntity')
      .select('1')
      .where('noticeReadLogEntity.noticeIdx = noticeEntity.noticeIdx')
      .andWhere('noticeReadLogEntity.userIdx = :userIdx')
      .getQuery();

    const result = await this.noticeModel
      .createQueryBuilder('noticeEntity')
      .where(`NOT EXISTS (${subQuery})`)
      .andWhere('noticeEntity.category = :category', { category: NoticeCategoryEnum.NOTICE })
      .setParameter('userIdx', userIdx)
      .getCount();

    return result;
  }

  async createNoticeAttendeeList(noticeIdx: number, attendeeUserIdxs: number[]): Promise<void> {
    for (const attendeeUserIdx of attendeeUserIdxs) {
      await this.noticeAttendeeModel
        .createQueryBuilder()
        .insert()
        .into(NoticeAttendeeEntity)
        .values({ noticeIdx, attendeeUserIdx: Number(attendeeUserIdx) })
        .execute();
    }

    return;
  }

  async createNoticeCCUserList(noticeIdx: number, ccUserIdxList: number[]): Promise<void> {
    for (const ccUserIdx of ccUserIdxList) {
      await this.noticeCCUserModel
        .createQueryBuilder()
        .insert()
        .into(NoticeCCUserEntity)
        .values({ noticeIdx, ccUserIdx: Number(ccUserIdx) })
        .execute();
    }

    return;
  }
}
