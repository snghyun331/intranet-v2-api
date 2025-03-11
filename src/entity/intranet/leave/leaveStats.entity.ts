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

  @Column({ name: 'total_received_annual_leave', comment: '부여받은 총 연차 수', nullable: false })
  totalReceivedAnnualLeave: number;

  @Column({ name: 'total_annual_leave_usage', comment: '사용 연차 수', default: 0, nullable: false })
  totalAnnualLeaveUsage: number;

  @Column({ name: 'mid_join_received_annual_leave', comment: '중도 입사 연차 부여 개수', default: 0, nullable: false })
  midJoinReceivedAnnualLeave: number;

  @Column({ name: 'full_leave_usage', comment: '사용 연차(1일 단위) 수', default: 0, nullable: false })
  fullLeaveUsage: number;

  @Column({ name: 'half_leave_usage', comment: '사용 반차 수', default: 0, nullable: false })
  halfLeaveUsage: number;

  @Column({ name: 'quarter_leave_usage', comment: '사용 반반차 수', default: 0, nullable: false })
  quarterLeaveUsage: number;

  @Column({ name: 'special_leave_usage', comment: '사용 특별휴무 수', default: 0, nullable: false })
  specialLeaveUsage: number;

  @Column({ name: 'alternative_leave_usage', comment: '사용 대체휴무 수', default: 0, nullable: false })
  alternativeLeaveUsage: number;

  @Column({ name: 'sick_leave_usage', comment: '사용 병가 수', default: 0, nullable: false })
  sickLeaveUsage: number;

  @Column({ name: 'health_leave_usage', comment: '사용 보건휴가 수', default: 0, nullable: false })
  healthLeaveUsage: number;

  @Column({ name: 'training_leave_usage', comment: '사용 훈련휴무 수', default: 0, nullable: false })
  trainingLeaveUsage: number;

  @Column({ name: 'familyEvent_leave_usage', comment: '사용 경조휴무 수', default: 0, nullable: false })
  familyEventLeaveUsage: number;

  @Column({ name: 'note', comment: '특이사항', type: 'text', nullable: true })
  note: string;
}
