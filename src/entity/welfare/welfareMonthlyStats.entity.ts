import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'welfare_monthly_stas', comment: '복포 월별 통계 tb' })
export class WelfareMonthlyStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'welfare_monthly_stats_idx', comment: '복포 월별 통계 IDX' })
  welfareMonthlyStasIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: string;

  @Column({ name: 'welfare_month_expense', comment: '복지포인트 월별 사용금액', default: 0, nullable: false })
  welfareMonthExpense: number;

  @ManyToOne(() => UserEntity, (user) => user.welfareStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
