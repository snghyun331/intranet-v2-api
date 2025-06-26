import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NoticeEntity } from './notice.entity';
import { UserEntity } from '@entity/user/user.entity';
import { CommonEntity } from '@common/entity/common.entity';

@Entity({ name: 'notice_cc_user', comment: '게시글 참조 사용자 목록 tb' })
export class NoticeCCUserEntity extends CommonEntity {
  @PrimaryColumn({ name: 'commute_idx', comment: '게시글IDX' })
  noticeIdx: number;

  @PrimaryColumn({ name: 'cc_user_idx', comment: '참조 사용자IDX' })
  ccUserIdx: number;

  @ManyToOne(() => NoticeEntity, (notice) => notice.noticeCCUserRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'notice_idx', referencedColumnName: 'noticeIdx' })
  noticeIdxRelation: NoticeEntity;

  @ManyToOne(() => UserEntity, (user) => user.noticeCCUserRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cc_user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
