import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingReservationEntity } from '../../../entity/meeting/meetingReservation.entity';
import { DeleteResult, Repository } from 'typeorm';
import { MeetingParticipantEntity } from '../../../entity/meeting/meetingParticipant.entity';
import { CreateMeetingReservationDto } from '../dto/createMeeting.dto';
import { ParticipantTypeEnum, YNEnum } from '../../../common/constant/enum';
import { MeetingRoomEntity } from '../../../entity/meeting/meetingRoom.entity';
import { UserEntity } from '../../../entity/user/user.entity';

@Injectable()
export class MeetingRepository {
  constructor(
    @InjectRepository(MeetingReservationEntity)
    private readonly meetingReservationModel: Repository<MeetingReservationEntity>,
    @InjectRepository(MeetingParticipantEntity)
    private readonly meetingParticipantModel: Repository<MeetingParticipantEntity>,
    @InjectRepository(MeetingRoomEntity)
    private readonly meetingRoomModel: Repository<MeetingRoomEntity>,
  ) {}

  async createReservation(newReservation: CreateMeetingReservationDto, userIdx: number): Promise<number> {
    const result = await this.meetingReservationModel
      .createQueryBuilder()
      .insert()
      .into(MeetingReservationEntity)
      .values({ userIdx, ...newReservation })
      .execute();

    const reservationIdx: number = result.identifiers[0].reservationIdx;

    return reservationIdx;
  }

  async checkTimeConflict(roomIdx: number, meetingDate: string, startTime: string, endTime: string): Promise<boolean> {
    const conflictCount: number = await this.meetingReservationModel
      .createQueryBuilder('meetinReservationEntity')
      .where('meetinReservationEntity.roomIdx = :roomIdx', { roomIdx })
      .andWhere('meetinReservationEntity.meetingDate = :meetingDate', { meetingDate })
      .andWhere('(meetinReservationEntity.startTime < :endTime AND meetinReservationEntity.endTime > :startTime)', {
        startTime,
        endTime,
      })
      .getCount();

    return conflictCount > 0;
  }

  async createParticipants(
    reservationIdx: number,
    userIdxs: number[],
    participantType: ParticipantTypeEnum,
  ): Promise<void> {
    await Promise.all(
      userIdxs.map(async (userIdx) => {
        await this.meetingParticipantModel
          .createQueryBuilder()
          .insert()
          .into(MeetingParticipantEntity)
          .values({ reservationIdx, userIdx: Number(userIdx), participantType })
          .execute();
      }),
    );
  }

  async getReservation(reservationIdx: number) {
    const result = await this.meetingReservationModel
      .createQueryBuilder('meetingReservationEntity')
      .select(['meetingReservationEntity.userIdx AS userIdx'])
      .where('meetingReservationEntity.reservationIdx = :reservationIdx', { reservationIdx })
      .getRawOne();

    return result;
  }

  async deleteReservation(reservationIdx: number): Promise<DeleteResult> {
    return await this.meetingReservationModel
      .createQueryBuilder()
      .delete()
      .from(MeetingReservationEntity)
      .where('reservationIdx = :reservationIdx', { reservationIdx })
      .execute();
  }

  async getAvailableRooms() {
    const result = await this.meetingRoomModel
      .createQueryBuilder('meetingRoomEntity')
      .select([
        'meetingRoomEntity.roomIdx AS roomIdx',
        'meetingRoomEntity.roomName AS roomName',
        'meetingRoomEntity.capacity AS capacity',
        'meetingRoomEntity.activeYN AS activeYN',
      ])
      .where('meetingRoomEntity.activeYN = :activeYN', { activeYN: YNEnum.YES })
      .getRawMany();

    return result;
  }

  async getMeetingSchedule(meetingDate: string) {
    const result = await this.meetingReservationModel
      .createQueryBuilder('meetingReservationEntity')
      .select([
        'meetingReservationEntity.reservationIdx AS reservationIdx',
        'meetingReservationEntity.userIdx AS writerIdx',
        'writerEntity.userName AS writerName',
        'meetingReservationEntity.title AS title',
        'meetingReservationEntity.content AS content',
        'meetingReservationEntity.meetingDate AS meetingDate',
        'meetingReservationEntity.startTime AS startTime',
        'meetingReservationEntity.endTime AS endTime',
        'meetingReservationEntity.meetingType AS meetingType',
        'meetingReservationEntity.roomIdx AS roomIdx',
        'meetingReservationEntity.description AS description',
        'meetingParticipantEntity.userIdx AS participantIdx',
        'meetingParticipantEntity.participantType AS participantType',
        'participantEntity.userName AS participantName',
      ])
      .innerJoin(UserEntity, 'writerEntity', 'writerEntity.userIdx = meetingReservationEntity.userIdx')
      .leftJoin(
        MeetingParticipantEntity,
        'meetingParticipantEntity',
        'meetingParticipantEntity.reservationIdx = meetingReservationEntity.reservationIdx',
      )
      .leftJoin(UserEntity, 'participantEntity', 'participantEntity.userIdx = meetingParticipantEntity.userIdx')
      .where('meetingReservationEntity.meetingDate = :meetingDate', { meetingDate })
      // .orderBy('meetingReservationEntity.startTime', 'ASC')
      // .addOrderBy('meetingParticipantEntity.participantType', 'ASC')
      .getRawMany();

    return result;
  }
}
