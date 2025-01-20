import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'leave', comment: '휴가 정보 tb' })
export class LeaveEntity {
  @PrimaryGeneratedColumn({ name: 'leave_idx', comment: '휴가내역IDX' })
  leaveIdx: number;
}
