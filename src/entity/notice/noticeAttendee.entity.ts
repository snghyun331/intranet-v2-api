import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { NoticeEntity } from './notice.entity';
import { UserEntity } from '@entity/user/user.entity';
import { CommonEntity } from '@common/entity/common.entity';

@Entity({ name: 'notice_attendee', comment: '게시글 참석자 목록 tb' })
export class NoticeAttendeeEntity extends CommonEntity {
  @PrimaryColumn({ name: 'notice_idx', comment: '게시글IDX' })
  noticeIdx: number;

  @PrimaryColumn({ name: 'attendee_user_idx', comment: '참석자 사용자IDX' })
  attendeeUserIdx: number;

  @ManyToOne(() => NoticeEntity, (notice) => notice.noticeAttendeeRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'notice_idx', referencedColumnName: 'noticeIdx' })
  noticeIdxRelation: NoticeEntity;

  @ManyToOne(() => UserEntity, (user) => user.noticeAttendeeRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'attendee_user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
