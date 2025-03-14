import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LeaveTypeEntity } from './leaveType.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'leave_monthly_usage', comment: '휴가사용 월별 사용량 tb' })
export class LeaveMonthlyUsageEntity {
  @PrimaryGeneratedColumn({ name: 'leave_monthly_usage_idx', comment: '휴가 월별 사용량IDX' })
  leaveMonthlyUsageIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: string;

  @Column({ name: 'leave_type_idx', comment: '근태(휴가)유형 IDX', nullable: false })
  leaveTypeIdx: number;

  @Column({ name: 'monthly_use_count', comment: '월별 사용개수', default: 0, nullable: false })
  monthlyUseCount: number;

  @ManyToOne(() => UserEntity, (user) => user.monthlyUseCountRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @ManyToOne(() => LeaveTypeEntity, (leaveType) => leaveType.monthlyUseCountRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_idx', referencedColumnName: 'leaveTypeIdx' })
  leaveTypeIdxRelation: LeaveTypeEntity;
}
