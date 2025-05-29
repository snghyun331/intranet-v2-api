import { Entity, PrimaryColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { CommuteEntity } from './commute.entity';
import { UserEntity } from '@entity/user/user.entity';
import { CommonEntity } from '@common/entity/common.entity';

@Entity({ name: 'commute_approver', comment: '근태 승인 가능 목록 tb' })
export class CommuteApproverEntity extends CommonEntity {
  @PrimaryColumn({ name: 'commute_idx', comment: '근태내역IDX' })
  commuteIdx: number;

  @PrimaryColumn({ name: 'approver_idx', comment: '승인가능자 IDX' })
  approverIdx: number;

  @Column({ name: 'last_checked_at', comment: '마지막 확인 시간', nullable: true })
  lastCheckedAt: Date;

  @ManyToOne(() => CommuteEntity, (commute) => commute.commuteApproverRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'commute_idx', referencedColumnName: 'commuteIdx' })
  commuteIdxRelation: CommuteEntity;

  @ManyToOne(() => UserEntity, (user) => user.commuteApproverRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'approver_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
