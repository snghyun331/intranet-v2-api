import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { MeetingRoomEntity } from './meetingRoom.entity';
import { MeetingParticipantEntity } from './meetingParticipant.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'meeting_reservation', comment: '회의실 예약 정보 tb' })
export class MeetingReservationEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'reservation_idx', comment: '회의실 예약IDX' })
  reservationIdx: number;

  @Column({ name: 'user_idx', comment: '작성자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'title', comment: '제목', length: 100, nullable: false })
  title: string;

  @Column({ name: 'content', comment: '내용', type: 'text', nullable: true })
  content: string;

  @Column({ name: 'meeting_date', comment: '회의일자', type: String, nullable: false })
  meetingDate: Date;

  @Column({ name: 'start_time', comment: '시작 시간', type: String, nullable: false })
  startTime: string;

  @Column({ name: 'end_time', comment: '종료 시간', type: String, nullable: false })
  endTime: string;

  @Column({ name: 'meeting_type', comment: '회의 유형', type: String, nullable: false })
  meetingType: string;

  @Column({ name: 'room_idx', comment: '회의실 IDX', type: Number, nullable: false })
  roomIdx: number;

  @Column({ name: 'description', comment: '비고', type: String, nullable: true })
  description: string;

  @OneToMany(() => MeetingParticipantEntity, (meetingParticipant) => meetingParticipant.reservationIdxRelation)
  meetingParticipantRelation: MeetingParticipantEntity[];

  @ManyToOne(() => MeetingRoomEntity, (room) => room.reservationRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'room_idx', referencedColumnName: 'roomIdx' })
  roomIdxRelation: MeetingRoomEntity;

  @ManyToOne(() => UserEntity, (user) => user.meetingReservationRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
