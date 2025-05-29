import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { CommuteEntity } from './commute.entity';
import { UserEntity } from '@entity/user/user.entity';
import { CommonEntity } from '@common/entity/common.entity';

@Entity({ name: 'commute_cc_user', comment: '근태 참조 사용자 목록 tb' })
export class CommuteCCUserEntity extends CommonEntity {
  @PrimaryColumn({ name: 'commute_idx', comment: '근태내역IDX' })
  commuteIdx: number;

  @PrimaryColumn({ name: 'cc_user_idx', comment: '참조 사용자IDX' })
  ccUserIdx: number;

  @Column({ name: 'last_checked_at', comment: '마지막 확인 시간', nullable: true })
  lastCheckedAt: Date;

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
