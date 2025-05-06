import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { UserEntity } from '@entity/user/user.entity';

@Entity({ name: 'activity_monthly_stats', comment: '활동비 월별 통계 tb' })
export class ActivityMonthlyStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'activity_monthly_stats_idx', comment: '활동비 월별 통계 IDX' })
  activityMonthlyStasIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: string;

  @Column({ name: 'activity_month_expense', comment: '활동비 월별 사용금액', default: 0, nullable: false })
  activityMonthExpense: number;

  @ManyToOne(() => UserEntity, (user) => user.activityMonthStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
