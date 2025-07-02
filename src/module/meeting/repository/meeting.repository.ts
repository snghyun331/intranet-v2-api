import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingReservationEntity } from '@entity/meeting/meetingReservation.entity';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { MeetingParticipantEntity } from '@entity/meeting/meetingParticipant.entity';
import { CreateMeetingReservationDto } from '../dto/createMeeting.dto';
import { ParticipantTypeEnum } from '@common/constant/enum';
import { UserEntity } from '@entity/user/user.entity';
import { UpdateMeetingReservationDto } from '../dto/updateMeeting.dto';

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

  async updateReservation(reservationIdx: number, newReservation: UpdateMeetingReservationDto): Promise<UpdateResult> {
    return await this.meetingReservationModel
      .createQueryBuilder()
      .update(MeetingReservationEntity)
      .set(newReservation)
      .where('reservationIdx = :reservationIdx', { reservationIdx })
      .execute();
  }

  async checkTimeConflict(
    roomId: string,
    meetingDate: string,
    startTime: string,
    endTime: string,
    exceptReservationIdx?: number,
  ): Promise<boolean> {
    const query: SelectQueryBuilder<MeetingReservationEntity> = this.meetingReservationModel
      .createQueryBuilder('meetingReservationEntity')
      .where('meetingReservationEntity.roomId = :roomId', { roomId })
      .andWhere('meetingReservationEntity.meetingDate = :meetingDate', { meetingDate })
      .andWhere('(meetingReservationEntity.startTime < :endTime AND meetingReservationEntity.endTime > :startTime)', {
        startTime,
        endTime,
      });

    if (exceptReservationIdx) {
      query.andWhere('meetingReservationEntity.reservationIdx != :reservationIdx', {
        reservationIdx: exceptReservationIdx,
      });
    }

    const conflictCount: number = await query.getCount();

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

  async getReservationByIdx(reservationIdx: number) {
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
        'meetingReservationEntity.roomId AS roomId',
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

  async getMeetingCCUserIdxs(reservationIdx: number): Promise<number[]> {
    const result = await this.meetingParticipantModel
      .createQueryBuilder('meetingParticipantEntity')
      .select(['meetingParticipantEntity.userIdx AS ccUserIdx '])
      .where('meetingParticipantEntity.reservationIdx = :reservationIdx', { reservationIdx })
      .andWhere('meetingParticipantEntity.participantType = :participantType', {
        participantType: ParticipantTypeEnum.CC,
      })
      .getRawMany();

    const ccUserIdxList: number[] = result.map((r) => r.ccUserIdx);

    return ccUserIdxList;
  }

  async getMeetingAttendeeIdxs(reservationIdx: number): Promise<number[]> {
    const result = await this.meetingParticipantModel
      .createQueryBuilder('meetingParticipantEntity')
      .select(['meetingParticipantEntity.userIdx AS attendeeIdx '])
      .where('meetingParticipantEntity.reservationIdx = :reservationIdx', { reservationIdx })
      .andWhere('meetingParticipantEntity.participantType = :participantType', {
        participantType: ParticipantTypeEnum.ATTENDEE,
      })
      .getRawMany();

    const attendeeIdxList: number[] = result.map((r) => r.attendeeIdx);

    return attendeeIdxList;
  }

  async createMeetingAttendeeList(reservationIdx: number, attendeeUserIdxs: number[]): Promise<void> {
    await Promise.all(
      attendeeUserIdxs.map(async (attendeeUserIdx) => {
        await this.meetingParticipantModel
          .createQueryBuilder()
          .insert()
          .into(MeetingParticipantEntity)
          .values({ reservationIdx, userIdx: Number(attendeeUserIdx), participantType: ParticipantTypeEnum.ATTENDEE })
          .execute();
      }),
    );
  }

  async deleteMeetingAttendeeList(reservationIdx: number, attendeeIdxList: number[]): Promise<void> {
    await Promise.all(
      attendeeIdxList.map(async (attendeeIdx) => {
        await this.meetingParticipantModel
          .createQueryBuilder()
          .delete()
          .from(MeetingParticipantEntity)
          .where('reservationIdx = :reservationIdx', { reservationIdx })
          .andWhere('userIdx = :userIdx', { userIdx: attendeeIdx })
          .andWhere('participantType = :participantType', {
            participantType: ParticipantTypeEnum.ATTENDEE,
          })
          .execute();
      }),
    );
  }

  async createMeetingCCUserList(reservationIdx: number, ccUserIdxList: number[]): Promise<void> {
    await Promise.all(
      ccUserIdxList.map(async (ccUserIdx) => {
        await this.meetingParticipantModel
          .createQueryBuilder()
          .insert()
          .into(MeetingParticipantEntity)
          .values({ reservationIdx, userIdx: Number(ccUserIdx), participantType: ParticipantTypeEnum.CC })
          .execute();
      }),
    );
  }

  async deleteMeetingCCUserList(reservationIdx: number, ccUserIdxList: number[]): Promise<void> {
    await Promise.all(
      ccUserIdxList.map(async (ccUserIdx) => {
        await this.meetingParticipantModel
          .createQueryBuilder()
          .delete()
          .from(MeetingParticipantEntity)
          .where('reservationIdx = :reservationIdx', { reservationIdx })
          .andWhere('userIdx = :userIdx', { userIdx: ccUserIdx })
          .andWhere('participantType = :participantType', {
            participantType: ParticipantTypeEnum.CC,
          })
          .execute();
      }),
    );
  }

  async createParticipant(newParticipants: any[]): Promise<void> {
    if (newParticipants.length === 0) return;

    await this.meetingParticipantModel
      .createQueryBuilder()
      .insert()
      .into(MeetingParticipantEntity)
      .values(newParticipants)
      .execute();
  }

  async deleteParticipants(reservationIdx: number): Promise<DeleteResult> {
    return await this.meetingParticipantModel
      .createQueryBuilder()
      .delete()
      .from(MeetingParticipantEntity)
      .where('reservationIdx = :reservationIdx', { reservationIdx })
      .execute();
  }
}
