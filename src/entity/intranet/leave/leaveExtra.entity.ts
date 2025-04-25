import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';
import { UserEntity } from '../../user/user.entity';
import { LeaveTypeEntity } from './leaveType.entity';

@Entity({ name: 'leave_extra', comment: '휴가 추가 부여정보 tb' })
export class LeaveExtraEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'leave_extra_idx', comment: '휴가 추가 부여정보 IDX' })
  leaveExtraIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'extra_leave', comment: '부여 개수', type: 'float', nullable: false })
  extraLeave: number;

  @Column({ name: 'leave_type_idx', comment: '휴가 유형 IDX', nullable: false })
  leaveTypeIdx: number;

  @Column({ name: 'admin_name', comment: '작성자 이름', nullable: false })
  adminName: string;

  @Column({ name: 'note', comment: '내용', type: 'text', nullable: true })
  note: string;

  @ManyToOne(() => UserEntity, (user) => user.leaveExtraRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @ManyToOne(() => LeaveTypeEntity, (leaveType) => leaveType.leaveExtraRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_idx', referencedColumnName: 'leaveTypeIdx' })
  leaveTypeIdxRelation: LeaveTypeEntity;
}
