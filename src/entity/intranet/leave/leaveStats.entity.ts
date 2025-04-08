import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'leave_stats', comment: '휴가 통계 정보 tb' })
export class LeaveStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'leave_stats_idx', comment: '휴가 통계IDX' })
  leaveStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '회계연도', nullable: false })
  year: string;

  @Column({ name: 'total_received_annual_leave', comment: '부여받은 총 연차 수', type: 'float', nullable: false })
  totalReceivedAnnualLeave: number;

  @Column({ name: 'total_annual_leave_usage', comment: '사용 연차 수', type: 'float', default: 0, nullable: false })
  totalAnnualLeaveUsage: number;

  @Column({
    name: 'mid_join_received_annual_leave',
    comment: '중도입사 연차 부여 개수',
    type: 'float',
    default: 0,
    nullable: false,
  })
  midJoinReceivedAnnualLeave: number;

  @Column({ name: 'total_received_special_leave', comment: '부여받은 총 특별휴무 수', type: 'float', nullable: false })
  totalReceivedSpecialLeave: number;

  @Column({
    name: 'total_special_leave_usage',
    comment: '사용 특별휴무 수',
    type: 'float',
    default: 0,
    nullable: false,
  })
  totalSpecialLeaveUsage: number;

  @Column({
    name: 'total_received_alternative_leave',
    comment: '부여받은 총 대체휴무 수',
    type: 'float',
    nullable: false,
  })
  totalReceivedAlternativeLeave: number;

  @Column({
    name: 'total_alternative_leave_usage',
    comment: '사용 대체휴무 수',
    type: 'float',
    default: 0,
    nullable: false,
  })
  totalAlternativeLeaveUsage: number;

  @Column({ name: 'note', comment: '특이사항', type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => UserEntity, (user) => user.leaveStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
