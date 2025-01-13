import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../../common/entity/common.entity';
import { UserEntity } from '../../user/user.entity';
import { LateStatusEnum } from '../../../common/constant/enum';

@Entity({ name: 'commute', comment: '출퇴근 정보 tb' })
export class CommuteEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'commute_idx', comment: '출퇴근IDX' })
  commuteIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'commute_date', comment: '출근 날짜', nullable: false })
  commuteDate: string;

  @Column({ name: 'check_in_time', comment: '출근 시간', nullable: true })
  checkInTime: Date;

  @Column({ name: 'check_out_time', comment: '퇴근 시간', nullable: true })
  checkOutTime: Date;

  @Column({ name: 'late_status', comment: '지각여부', default: LateStatusEnum.ON_TIME, nullable: false })
  lateStatus: LateStatusEnum;

  @Column({ name: 'attendance', comment: '근태 상태', nullable: false })
  attendance: string;

  @Column({ name: 'update_reason', comment: '수정사유', nullable: true })
  updateReason: string;

  @Column({ name: 'note', comment: '특이사항', type: 'text', nullable: true })
  note: string;

  @Column({ name: 'check_in_device_type', comment: '출근 기기', nullable: false })
  checkInDeviceType: string;

  @Column({ name: 'check_out_device_type', comment: '출근 기기', nullable: false })
  checkOutDeviceType: string;

  @ManyToOne(() => UserEntity, (user) => user.commuteRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
