import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';

@Entity({ name: 'leave_stats', comment: '휴가 통계 정보 tb' })
export class LeaveStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'leave_stats_idx', comment: '휴가 통계IDX' })
  leaveStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '회계연도', nullable: false })
  year: string;

  @Column({ name: 'total_annual_leave', comment: '총 연차 수', nullable: false })
  totalAnnualLeave: number;

  @Column({ name: 'annual_leave_balance', comment: '잔여 연차 수', default: 0, nullable: false })
  annualLeaveBalance: number;

  @Column({ name: 'note', comment: '특이사항', type: 'text', nullable: true })
  note: string;
}
