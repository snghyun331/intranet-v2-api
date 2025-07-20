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
      .values({ creatorName: writerName, lastEditorName: writerName, lastUpdateAt: new Date(), ...noticeInfo })
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

  async updateNotice(
    adminName: string,
    noticeIdx: number,
    { title, content, category, place, useCar, startDate, endDate }: UpdateNoticeDto,
  ): Promise<UpdateResult> {
    return await this.noticeModel
      .createQueryBuilder()
      .update(NoticeEntity)
      .set({
        lastEditorName: adminName,
        lastUpdateAt: new Date(),
        title,
        content,
        category,
        place,
        useCar,
        startDate,
        endDate,
      })
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
        `CASE WHEN EXISTS (
          SELECT 1 FROM notice_read_log readLog
          WHERE readLog.notice_idx = noticeEntity.notice_idx
          AND readLog.user_idx = ${userIdx}
        ) THEN 0 ELSE 1 END AS isNew`,

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
        'noticeEntity.lastUpdateAt AS lastUpdateAt',
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
      .leftJoin(NoticeHasImageEntity, 'noticeImageEntity', 'noticeImageEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = noticeImageEntity.imageIdx')
      .leftJoin(NoticeCCUserEntity, 'noticeCCUserEntity', 'noticeCCUserEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = noticeCCUserEntity.ccUserIdx')
      .leftJoin(NoticeAttendeeEntity, 'noticeAttendeeEntity', 'noticeAttendeeEntity.noticeIdx = noticeEntity.noticeIdx')
      .leftJoin(UserEntity, 'attendeeUserEntity', 'attendeeUserEntity.userIdx = noticeAttendeeEntity.attendeeUserIdx')
      .where('noticeEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getRawMany();

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

  /* 카테고리가 공지사항/기타 이거나 본인이 참조된 미팅일 경우, 카운팅 */
  async getNewNoticeCount(userIdx: number): Promise<number> {
    const subQuery: string = this.noticeReadLogModel
      .createQueryBuilder('noticeReadLogEntity')
      .select('1')
      .where('noticeReadLogEntity.noticeIdx = noticeEntity.noticeIdx')
      .andWhere('noticeReadLogEntity.userIdx = :userIdx')
      .getQuery();

    const mainQuery: SelectQueryBuilder<NoticeEntity> = this.noticeModel
      .createQueryBuilder('noticeEntity')
      .where(`NOT EXISTS (${subQuery})`)
      .andWhere(
        new Brackets((qb) => {
          qb.where('noticeEntity.category IN (:...categories)', {
            categories: [NoticeCategoryEnum.NOTICE, NoticeCategoryEnum.ETC],
          })
            .orWhere(
              'EXISTS (SELECT 1 FROM notice_cc_user ccEntity WHERE ccEntity.notice_idx = noticeEntity.notice_idx AND ccEntity.cc_user_idx = :userIdx)',
            )
            .orWhere(
              'EXISTS (SELECT 1 FROM notice_attendee attendeeEntity WHERE attendeeEntity.notice_idx = noticeEntity.notice_idx AND attendeeEntity.attendee_user_idx = :userIdx)',
            );
        }),
      )
      .setParameter('userIdx', userIdx);

    const result = await mainQuery.getCount();

    return result;
  }

  async createNoticeAttendeeList(noticeIdx: number, attendeeUserIdxs: number[]): Promise<void> {
    await Promise.all(
      attendeeUserIdxs.map(async (attendeeUserIdx) => {
        await this.noticeAttendeeModel
          .createQueryBuilder()
          .insert()
          .into(NoticeAttendeeEntity)
          .values({ noticeIdx, attendeeUserIdx: Number(attendeeUserIdx) })
          .execute();
      }),
    );
  }

  async deleteNoticeAttendeeList(noticeIdx: number, attendeeIdxList: number[]): Promise<void> {
    await Promise.all(
      attendeeIdxList.map(async (attendeeUserIdx) => {
        await this.noticeAttendeeModel
          .createQueryBuilder()
          .delete()
          .from(NoticeAttendeeEntity)
          .where('noticeIdx = :noticeIdx', { noticeIdx })
          .andWhere('attendeeUserIdx = :attendeeUserIdx', { attendeeUserIdx })
          .execute();
      }),
    );
  }

  async createNoticeCCUserList(noticeIdx: number, ccUserIdxList: number[]): Promise<void> {
    await Promise.all(
      ccUserIdxList.map(async (ccUserIdx) => {
        await this.noticeCCUserModel
          .createQueryBuilder()
          .insert()
          .into(NoticeCCUserEntity)
          .values({ noticeIdx, ccUserIdx: Number(ccUserIdx) })
          .execute();
      }),
    );
  }

  async deleteNoticeCCUserList(noticeIdx: number, ccUserIdxList: number[]): Promise<void> {
    await Promise.all(
      ccUserIdxList.map(async (ccUserIdx) => {
        await this.noticeCCUserModel
          .createQueryBuilder()
          .delete()
          .from(NoticeCCUserEntity)
          .where('noticeIdx = :noticeIdx', { noticeIdx })
          .andWhere('ccUserIdx = :ccUserIdx', { ccUserIdx })
          .execute();
      }),
    );
  }

  async getNoticeCCUserIdxs(noticeIdx: number): Promise<number[]> {
    const result = await this.noticeCCUserModel
      .createQueryBuilder('noticeCCUserEntity')
      .select(['noticeCCUserEntity.ccUserIdx AS ccUserIdx '])
      .where('noticeCCUserEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getRawMany();

    const ccUserIdxList: number[] = result.map((r) => r.ccUserIdx);

    return ccUserIdxList;
  }

  async getNoticeAttendeeIdxs(noticeIdx: number): Promise<number[]> {
    const result = await this.noticeAttendeeModel
      .createQueryBuilder('noticeAttendeeEntity')
      .select(['noticeAttendeeEntity.attendeeUserIdx AS attendeeUserIdx '])
      .where('noticeAttendeeEntity.noticeIdx = :noticeIdx', { noticeIdx })
      .getRawMany();

    const attendeeIdxList: number[] = result.map((r) => r.attendeeUserIdx);

    return attendeeIdxList;
  }
}
