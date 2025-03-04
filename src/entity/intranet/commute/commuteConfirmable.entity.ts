import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CommuteEntity } from './commute.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'commute_comfirmable', comment: '근태 승인 가능 목록 tb' })
export class CommuteConfirmableEntity {
  @Column({ primary: true, name: 'commute_idx', comment: '근태내역IDX', nullable: false })
  commuteIdx: number;

  @Column({ primary: true, name: 'user_idx', comment: '승인가능자 IDX', nullable: false })
  userIdx: number;

  @ManyToOne(() => CommuteEntity, (commute) => commute.commuteConfirmableRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'commute_idx', referencedColumnName: 'commuteIdx' })
  commuteIdxRelation: CommuteEntity;

  @ManyToOne(() => UserEntity, (user) => user.commuteConfirmableRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
