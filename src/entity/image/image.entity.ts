import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { NoticeHasImageEntity } from './noticeHasImage.entity';
import { CommuteHasImageEntity } from './commuteHasImage.entity';

@Entity({ name: 'image', comment: '이미지 tb' })
export class ImageEntity {
  @PrimaryGeneratedColumn({ name: 'image_idx', comment: '이미지 IDX' })
  imageIdx: number;

  @Column({ name: 'image_name', comment: '이미지 이름', nullable: true })
  imageName: string;

  @Column({ name: 'image_size', comment: '이미지 크기', type: Number, nullable: true })
  imageSize: number;

  @Column({ name: 'image_url', comment: '이미지 URL', nullable: true })
  imageUrl: string;

  @OneToMany(() => NoticeHasImageEntity, (noticeImage) => noticeImage.imageIdxRelation)
  noticeImageRelation: NoticeHasImageEntity[];

  @OneToMany(() => CommuteHasImageEntity, (commuteImage) => commuteImage.imageIdxRelation)
  commuteImageRelation: CommuteHasImageEntity[];
}
