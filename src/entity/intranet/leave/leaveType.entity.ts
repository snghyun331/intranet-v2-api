import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommuteEntity } from '../commute/commute.entity';
import { LeaveMonthlyUsageEntity } from './leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from './leaveUsage.entity';
import { LeaveExtraEntity } from './leaveExtra.entity';

@Entity({ name: 'leave_type', comment: '근태(휴가) 유형' })
export class LeaveTypeEntity {
  @PrimaryGeneratedColumn({ name: 'leave_type_idx', comment: '근태(휴가) 유형 IDX' })
  leaveTypeIdx: number;

  @Column({ name: 'leave_type', comment: '근태(휴가) 유형' })
  leaveType: string;

  @OneToMany(() => CommuteEntity, (commute) => commute.leaveTypeIdxRelation)
  commuteRelation: CommuteEntity[];

  @OneToMany(() => LeaveMonthlyUsageEntity, (monthlyUseCount) => monthlyUseCount.leaveTypeIdxRelation)
  monthlyUseCountRelation: LeaveMonthlyUsageEntity[];

  @OneToMany(() => LeaveUsageEntity, (usage) => usage.leaveTypeIdxRelation)
  usageRelation: LeaveUsageEntity[];

  @OneToMany(() => LeaveExtraEntity, (leaveExtra) => leaveExtra.leaveTypeIdxRelation)
  leaveExtraRelation: LeaveExtraEntity[];
}
