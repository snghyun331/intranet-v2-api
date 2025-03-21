import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CommuteEntity } from './commute.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'commute_cc_user', comment: '근태 참조 사용자 목록 tb' })
export class ComuteCCUserEntity {
  @PrimaryColumn({ name: 'commute_idx', comment: '근태내역IDX' })
  commuteIdx: number;

  @PrimaryColumn({ name: 'cc_user_idx', comment: '참조 사용자IDX' })
  ccUserIdx: number;

  @ManyToOne(() => CommuteEntity, (commute) => commute.commuteApproverRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'commute_idx', referencedColumnName: 'commuteIdx' })
  commuteIdxRelation: CommuteEntity;

  @ManyToOne(() => UserEntity, (user) => user.commuteCCUserRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'cc_user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
