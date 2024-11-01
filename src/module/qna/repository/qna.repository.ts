import { Injectable } from '@nestjs/common';
import { CreateQnaDto } from '../dto/createQna.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QnaEntity } from '../../../entity/qna/qna.entity';
import { EntityManager, Repository } from 'typeorm';
import { UserEntity } from '../../../entity/user/user.entity';

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
        'qnaEntity.createdAt AS createdAt',
      ])
      .where('qnaEntity.userIdx = :userIdx', { userIdx })
      .getRawMany();

    return result;
  }
}
