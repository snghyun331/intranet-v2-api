import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { NoticeEntity } from '@entity/notice/notice.entity';
import { ImageEntity } from '@entity/image/image.entity';

@Entity({ name: 'notice_has_image', comment: '공지사항 이미지 tb' })
export class NoticeHasImageEntity {
  @Column({ primary: true, name: 'image_idx', comment: '이미지 IDX', nullable: false })
  imageIdx: number;

  @Column({ primary: true, name: 'notice_idx', comment: '공지사항 IDX', nullable: false })
  noticeIdx: number;

  @ManyToOne(() => ImageEntity, (image) => image.noticeImageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'image_idx', referencedColumnName: 'imageIdx' })
  imageIdxRelation: ImageEntity;

  @ManyToOne(() => NoticeEntity, (notice) => notice.noticeImageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'notice_idx', referencedColumnName: 'noticeIdx' })
  noticeIdxRelation: NoticeEntity;
}
