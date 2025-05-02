import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ImageEntity } from '@entity/image/image.entity';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';

@Entity({ name: 'commute_has_image', comment: '근태 증빙 이미지 tb' })
export class CommuteHasImageEntity {
  @Column({ primary: true, name: 'image_idx', comment: '이미지 IDX', nullable: false })
  imageIdx: number;

  @Column({ primary: true, name: 'commute_idx', comment: '근태 IDX', nullable: false })
  commuteIdx: number;

  @ManyToOne(() => ImageEntity, (image) => image.commuteImageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'image_idx', referencedColumnName: 'imageIdx' })
  imageIdxRelation: ImageEntity;

  @ManyToOne(() => CommuteEntity, (commute) => commute.commuteImageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'commute_idx', referencedColumnName: 'commuteIdx' })
  commuteIdxRelation: CommuteEntity;
}
