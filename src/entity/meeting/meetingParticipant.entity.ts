import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { MeetingReservationEntity } from './meetingReservation.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'meeting_participant', comment: '회의실 참석자 정보 tb' })
export class MeetingParticipantEntity extends CommonEntity {
  @PrimaryColumn({ name: 'reservation_idx', comment: '예약IDX' })
  reservationIdx: number;

  @PrimaryColumn({ name: 'user_idx', comment: '사용자 IDX' })
  userIdx: number;

  @Column({ name: 'participant_type', comment: '참석 유형(참석/참조)', nullable: false })
  participantType: string;

  @ManyToOne(() => MeetingReservationEntity, (reservation) => reservation.meetingParticipantRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reservation_idx', referencedColumnName: 'reservationIdx' })
  reservationIdxRelation: MeetingReservationEntity;

  @ManyToOne(() => UserEntity, (user) => user.meetingParticipantRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
