import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';

@Entity({ name: 'leave_monthly_stats', comment: '휴가사용 월별 통계 tb' })
export class LeaveMontlyStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'leave_monthly_stats_idx', comment: '휴가 월별 통계IDX' })
  leaveMonthlyStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: string;

  @Column({ name: 'annual_monthly_usage', comment: '연차 월별 사용량', default: 0, nullable: false })
  annualMonthlyUsage: number;

  @Column({ name: 'half_monthly_usage', comment: '반차 월별 사용량', default: 0, nullable: false })
  halfMonthlyUsage: number;

  @Column({ name: 'quarter_monthly_usage', comment: '반반차 월별 사용량', default: 0, nullable: false })
  quarterMonthlyUsage: number;

  @Column({ name: 'sick_monthly_usage', comment: '병가 월별 사용량', default: 0, nullable: false })
  sickMonthlyUsage: number;

  @Column({ name: 'health_monthly_usage', comment: '보건휴가 월별 사용량', default: 0, nullable: false })
  healthMonthlyUsage: number;

  @Column({ name: 'special_monthly_usage', comment: '특별휴무 월별 사용량', default: 0, nullable: false })
  specialMonthlyUsage: number;

  @Column({ name: 'alternative_monthly_usage', comment: '대체휴무 월별 사용량', default: 0, nullable: false })
  alternativeMonthlyUsage: number;

  @Column({ name: 'familyEvent_monthly_usage', comment: '경조휴무 월별 사용량', default: 0, nullable: false })
  familyEventMonthlyUsage: number;

  @Column({ name: 'training_monthly_usage', comment: '훈련휴무 월별 사용량', default: 0, nullable: false })
  trainingMonthlyUsage: number;
}
