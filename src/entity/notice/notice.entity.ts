import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { NoticeHasImageEntity } from '@entity/image/noticeHasImage.entity';
import { NoticeReadLogEntity } from './noticeReadLog.entity';
import { NoticeCategoryEnum } from '../../module/notice/constant/enum';
import { YNEnum } from '../../common/constant/enum';
import { NoticeCCUserEntity } from './noticeCCUser.entity';
import { NoticeAttendeeEntity } from './noticeAttendee.entity';

@Entity({ name: 'notice', comment: '공지사항 tb' })
export class NoticeEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'notice_idx', comment: '공지사항 IDX' })
  noticeIdx: number;

  @Column({ name: 'title', comment: '제목', length: 100, nullable: false })
  title: string;

  @Column({ name: 'category', comment: '카테고리', default: NoticeCategoryEnum.ETC, nullable: false })
  category: string;

  @Column({ name: 'place', comment: '장소', type: 'text', nullable: true })
  place: string;

  @Column({ name: 'content', comment: '내용', type: 'text', nullable: true })
  content: string;

  @Column({ name: 'use_car_yn', comment: '차량 사용 여부', type: 'enum', enum: YNEnum, default: YNEnum.NO })
  useCarYN: YNEnum;

  @Column({ name: 'creator_name', comment: '초기 작성자 이름', nullable: false })
  creatorName: string;

  @Column({ name: 'last_editor_name', comment: '마지막 수정자 이름', nullable: false })
  lastEditorName: string;

  @Column({ type: String, comment: '게시 시작일', nullable: true })
  startDate: string;

  @Column({ type: String, comment: '게시 종료일', nullable: true })
  endDate: string;

  @OneToMany(() => NoticeHasImageEntity, (noticeImage) => noticeImage.noticeIdxRelation)
  noticeImageRelation: NoticeHasImageEntity[];

  @OneToMany(() => NoticeReadLogEntity, (noticeReadLog) => noticeReadLog.noticeIdxRelation)
  noticeReadLogRelation: NoticeReadLogEntity[];

  @OneToMany(() => NoticeCCUserEntity, (noticeCCUser) => noticeCCUser.noticeIdxRelation)
  noticeCCUserRelation: NoticeCCUserEntity[];

  @OneToMany(() => NoticeAttendeeEntity, (noticeAttendee) => noticeAttendee.noticeIdxRelation)
  noticeAttendeeRelation: NoticeAttendeeEntity[];
}
