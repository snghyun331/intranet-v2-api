import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { LeaveTypeEntity } from './leaveType.entity';
import { UserEntity } from '../../user/user.entity';

@Entity({ name: 'leave_usage', comment: '휴가사용 월별 사용량 tb' })
export class LeaveUsageEntity {
  @PrimaryGeneratedColumn({ name: 'leave_usage_idx', comment: '휴가 연도별 사용량IDX' })
  leaveUsageIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'leave_type_idx', comment: '근태(휴가)유형 IDX', nullable: false })
  leaveTypeIdx: number;

  @Column({ name: 'annual_use_count', comment: '연도별 사용개수', default: 0, nullable: false })
  annualUseCount: number;

  @ManyToOne(() => UserEntity, (user) => user.usageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @ManyToOne(() => LeaveTypeEntity, (leaveType) => leaveType.usageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_idx', referencedColumnName: 'leaveTypeIdx' })
  leaveTypeIdxRelation: LeaveTypeEntity;
}
