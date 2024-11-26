import { Injectable } from '@nestjs/common';
import { CreateQnaDto } from '../dto/createQna.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QnaEntity } from '../../../entity/qna/qna.entity';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { QnaAdminResult } from '../interface/result.interface';
import { QnaFilterDto } from '../dto/query.dto';
import { YNEnum } from '../../../common/constant/enum';
import { QnaInfo } from '../interface/qna.interface';
import { GradeEntity } from '../../../entity/user/grade.entity';

@Injectable()
export class QnaRepository {
  constructor(
    @InjectRepository(QnaEntity) private readonly qnaModel: Repository<QnaEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
  ) {}

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async createQna(userIdx: number, newQnaInfo: CreateQnaDto, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(QnaEntity)
      .values({ userIdx, ...newQnaInfo })
      .execute();
  }

  async getUserQna(userIdx: number): Promise<QnaEntity[]> {
    const result: QnaEntity[] = await this.qnaModel
      .createQueryBuilder('qnaEntity')
      .select([
        'qnaEntity.qnaIdx AS qnaIdx',
        'qnaEntity.userIdx AS userIdx',
        'qnaEntity.category AS category',
        'qnaEntity.text AS text',
        'qnaEntity.replySuccessYN AS replySuccessYN',
        'qnaEntity.replyText AS replyText',
        'qnaEntity.replyAdmin AS replyAdmin',
        'qnaEntity.createdAt AS createdAt',
      ])
      .where('qnaEntity.userIdx = :userIdx', { userIdx })
      .orderBy('qnaEntity.createdAt', 'DESC')
      .getRawMany();

    return result;
  }

  async getQna(pageNo: number, perPage: number, filterInfo: QnaFilterDto): Promise<QnaAdminResult> {
    const query: SelectQueryBuilder<QnaEntity> = this.qnaModel
      .createQueryBuilder('qnaEntity')
      .select([
        'qnaEntity.qnaIdx AS qnaIdx',
        'qnaEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.userCell AS userCell',
        'gradeEntity.gradeName AS gradeName',
        'qnaEntity.category AS category',
        'qnaEntity.text AS text',
        'qnaEntity.replySuccessYN AS replySuccessYN',
        'qnaEntity.replyText AS replyText',
        'qnaEntity.replyAdmin AS replyAdmin',
        'qnaEntity.createdAt AS createdAt',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = qnaEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.userAvail IS NULL');

    if (filterInfo.replySuccessYN) {
      query.andWhere('qnaEntity.replySuccessYN = :replySuccessYN', { replySuccessYN: filterInfo.replySuccessYN });
    }
    if (filterInfo.userCell) {
      query.andWhere('userEntity.userCell LIKE :userCell', { userCell: `${filterInfo.userCell}%` });
    }
    if (filterInfo.userName) {
      query.andWhere('userEntity.userName = :userName', { userName: filterInfo.userName });
    }

    const total = await query.getCount();
    const totalPage = Math.ceil(total / perPage);

    query
      .orderBy('qnaEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result: QnaInfo[] = await query.getRawMany();

    return { totalPage, total, qna: result };
  }

  async getQnaInfoByIdx(qnaIdx: number): Promise<QnaInfo> {
    const result: QnaInfo = await this.qnaModel
      .createQueryBuilder('qnaEntity')
      .select([
        'qnaEntity.qnaIdx AS qnaIdx',
        'qnaEntity.userIdx AS userIdx',
        'qnaEntity.replySuccessYN AS replySuccessYN',
      ])
      .where('qnaEntity.qnaIdx = :qnaIdx', { qnaIdx })
      .getRawOne();

    return result;
  }

  async deleteMyQna(qnaIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager.createQueryBuilder().delete().from(QnaEntity).where('qnaIdx = :qnaIdx', { qnaIdx }).execute();
  }

  async replyQna(qnaIdx: number, replyText: string, replyAdmin: string, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(QnaEntity)
      .set({ replyText, replySuccessYN: YNEnum.YES, replyAdmin })
      .where('qnaIdx = :qnaIdx', { qnaIdx })
      .execute();
  }

  async updateReply(
    qnaIdx: number,
    replyText: string,
    replyAdmin: string,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(QnaEntity)
      .set({ replyText, replyAdmin })
      .where('qnaIdx = :qnaIdx', { qnaIdx })
      .execute();
  }
}
