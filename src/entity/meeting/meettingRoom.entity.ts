import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { YNEnum } from '@common/constant/enum';
import { MeetingReservationEntity } from './meetingReservation.entity';

@Entity({ name: 'meeting_room', comment: '회의실 정보 tb' })
export class MeetingRoomEntity {
  @PrimaryGeneratedColumn({ name: 'room_idx', comment: '회의실 IDX' })
  roomIdx: number;

  @Column({ name: 'room_name', comment: '회의실 이름', type: String, nullable: false })
  roomName: string;

  @Column({ name: 'capacity', comment: '수용 인원', type: Number, nullable: false })
  capacity: number;

  @Column({
    name: 'active_yn',
    comment: '사용가능 여부',
    type: 'enum',
    enum: YNEnum,
    default: YNEnum.YES,
    nullable: false,
  })
  activeYN: YNEnum;

  @OneToMany(() => MeetingReservationEntity, (reservation) => reservation.roomIdxRelation)
  reservationRelation: MeetingReservationEntity[];
}
