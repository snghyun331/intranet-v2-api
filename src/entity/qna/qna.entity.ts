import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { UserEntity } from '../user/user.entity';
import { QnaCategoryEnum, YNEnum } from '../../common/constant/enum';

@Entity({ name: 'qna', comment: '문의 내역 tb' })
export class QnaEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'qna_idx', comment: '문의 내역 IDX' })
  qnaIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'category', comment: '문의 유형', type: 'enum', enum: QnaCategoryEnum, nullable: false })
  category: QnaCategoryEnum;

  @Column({ name: 'text', comment: '문의 내용', type: 'text', nullable: false })
  text: string;

  @Column({
    name: 'reply_success_yn',
    comment: '답변 여부',
    type: 'enum',
    enum: YNEnum,
    default: YNEnum.NO,
    nullable: false,
  })
  replySuccessYN: YNEnum;

  @Column({ name: 'reply_text', comment: '답변 내용', type: 'text', default: null, nullable: true })
  replyText: string;

  @ManyToOne(() => UserEntity, (user) => user.qnaRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
