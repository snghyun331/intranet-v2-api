import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';

@Entity({ name: 'notice', comment: '공지사항 tb' })
export class NoticeEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'notice_idx', comment: '공지사항 IDX' })
  noticeIdx: number;

  @Column({ name: 'title', comment: '제목', length: 100, nullable: false })
  title: string;

  @Column({ name: 'content', comment: '내용', type: 'text', nullable: false })
  content: string;

  @Column({ name: 'creator_name', comment: '초기 작성자 이름', nullable: false })
  creatorName: string;

  @Column({ name: 'last_editor_name', comment: '마지막 수정자 이름', nullable: false })
  lastEditorName: string;

  @Column({ name: 'image_url', comment: '첨부파일 URL', nullable: true })
  imageUrl: string;
}
