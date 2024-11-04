import { Injectable } from '@nestjs/common';
import { CreateQnaDto } from '../dto/createQna.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QnaEntity } from '../../../entity/qna/qna.entity';
import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { QnaAdminResult, QnaInfo } from '../interface/result.interface';
import { QnaFilterDto } from '../dto/query.dto';

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

  async createQna(userIdx: number, newQnaInfo: CreateQnaDto, manager: EntityManager) {
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
        'qnaEntity.category AS category',
        'qnaEntity.text AS text',
        'qnaEntity.replySuccessYN AS replySuccessYN',
        'qnaEntity.replyText AS replyText',
        'qnaEntity.replyAdmin AS replyAdmin',
        'qnaEntity.createdAt AS createdAt',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = qnaEntity.userIdx')
      .where('userEntity.userAvail IS NULL');

    if (filterInfo.replySuccessYN) {
      query.andWhere('qnaEntity.replySuccessYN = :replySuccessYN', { replySuccessYN: filterInfo.replySuccessYN });
    }
    if (filterInfo.userCell) {
      query.andWhere('userEntity.userCell LIKE :userCell', { userCell: `${filterInfo.userCell}%` });
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
}
