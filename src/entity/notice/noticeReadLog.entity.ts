import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { NoticeEntity } from './notice.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'notice_read_log', comment: '공지사항 확인 로그' })
export class NoticeReadLogEntity extends CommonEntity {
  @PrimaryColumn({ name: 'notice_idx', comment: '공지사항IDX', type: Number, nullable: false })
  noticeIdx: number;

  @PrimaryColumn({ name: 'user_idx', comment: '사용자IDX', type: Number, nullable: false })
  userIdx: number;

  @Column({ name: 'last_checked_at', comment: '마지막 확인 시간', nullable: true })
  lastCheckedAt: Date;

  @ManyToOne(() => NoticeEntity, (notice) => notice.noticeReadLogRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'notice_idx', referencedColumnName: 'noticeIdx' })
  noticeIdxRelation: NoticeEntity;

  @ManyToOne(() => UserEntity, (user) => user.noticeReadLogRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
