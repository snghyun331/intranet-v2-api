import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';
import { UserEntity } from '../../user/user.entity';
import { ConfirmEnum, IntranetAttendanceEnum } from '../../../common/constant/enum';
import { CommuteHasImageEntity } from '../../image/commuteHasImage.entity';
import { LeaveTypeEntity } from '../leave/leaveType.entity';

@Entity({ name: 'commute', comment: '출퇴근 정보 tb' })
export class CommuteEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'commute_idx', comment: '근태내역IDX' })
  commuteIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'commute_date', comment: '날짜', nullable: false })
  commuteDate: string;

  @Column({ name: 'check_in_time', comment: '출근 시간', nullable: true })
  checkInTime: Date;

  @Column({ name: 'check_out_time', comment: '퇴근 시간', nullable: true })
  checkOutTime: Date;

  @Column({ name: 'attendance', comment: '근태 상태', nullable: true })
  attendance: IntranetAttendanceEnum;

  @Column({ name: 'leave_type_idx', comment: '근태(휴가)유형 IDX', nullable: true })
  leaveTypeIdx: number;

  @Column({ name: 'working_minutes', comment: '근무 시간(분단위)', nullable: true })
  workingMinutes: number;

  @Column({ name: 'overtime_working_minutes', comment: '초과 근무 시간(분단위)', nullable: true })
  overtimeWorkingMinutes: number;

  @Column({ name: 'update_reason', comment: '수정사유', nullable: true })
  updateReason: string;

  @Column({ name: 'early_leave_reason', comment: '조기퇴근사유', nullable: true })
  earlyLeaveReason: string;

  @Column({ name: 'note', comment: '특이사항', type: 'text', nullable: true })
  note: string;

  @Column({ name: 'check_in_device_type', comment: '출근 기기', nullable: true })
  checkInDeviceType: string;

  @Column({ name: 'check_in_ip_addr', comment: '출근 등록 IP', nullable: true })
  checkInIpAddr: string;

  @Column({ name: 'check_out_device_type', comment: '퇴근 기기', nullable: true })
  checkOutDeviceType: string;

  @Column({ name: 'check_out_ip_addr', comment: '퇴근 등록 IP', nullable: true })
  checkOutIpAddr: string;

  @Column({
    name: 'confirm_yn',
    comment: '승인 여부',
    type: 'enum',
    enum: ConfirmEnum,
    default: ConfirmEnum.NO,
    nullable: false,
  })
  confirmYN: ConfirmEnum;

  @Column({ name: 'confirm_date', comment: '승인 날짜', type: String, nullable: true })
  confirmDate: string;

  @Column({ name: 'reject_date', comment: '반려 날짜', type: String, nullable: true })
  rejectDate: string;

  @Column({ name: 'confirm_person_idx', comment: '승인자 IDX', nullable: true })
  confirmPersonIdx: number;

  @ManyToOne(() => UserEntity, (user) => user.commuteRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @ManyToOne(() => LeaveTypeEntity, (leaveType) => leaveType.commuteRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'leave_type_idx', referencedColumnName: 'leaveTypeIdx' })
  leaveTypeIdxRelation: LeaveTypeEntity;

  @OneToMany(() => CommuteHasImageEntity, (commuteImage) => commuteImage.commuteIdxRelation)
  commuteImageRelation: CommuteHasImageEntity[];
}
