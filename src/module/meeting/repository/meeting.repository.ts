import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingReservationEntity } from '../../../entity/meeting/meetingReservation.entity';
import { DeleteResult, Repository } from 'typeorm';
import { MeetingParticipantEntity } from '../../../entity/meeting/mettingParticipant.entity';
import { CreateMeetingReservationDto } from '../dto/createMeeting.dto';
import { ParticipantTypeEnum } from '../../../common/constant/enum';

@Injectable()
export class MeetingRepository {
  constructor(
    @InjectRepository(MeetingReservationEntity)
    private readonly meetingReservationModel: Repository<MeetingReservationEntity>,
    @InjectRepository(MeetingParticipantEntity)
    private readonly meetingParticipantModel: Repository<MeetingParticipantEntity>,
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
}
