import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { MeetingRepository } from './repository/meeting.repository';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';
import { RedisLockService } from '../redis/redisLock.service';
import { MEETING_RESERVE_LOCK_DURATION } from '@common/constant/constant';
import { ParticipantTypeEnum } from '@common/constant/enum';
import { Transactional } from 'typeorm-transactional';
import { createKSTTimestamp } from '../../common/utils/utility';

@Injectable()
export class MeetingService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly meetingRepository: MeetingRepository,
    private readonly redisLockService: RedisLockService,
  ) {}

  @Transactional()
  async createReservation(dto: CreateMeetingReservationDto, userIdx: number): Promise<void> {
    const lockKey = `meeting:room:${dto.roomId}:date:${dto.meetingDate}:time:${dto.startTime}-${dto.endTime}`;
    const lock: boolean = await this.redisLockService.waitAndSetLock(lockKey, MEETING_RESERVE_LOCK_DURATION);

    try {
      if (lock) {
        // 시간 충돌 검사
        const isConflict: boolean = await this.meetingRepository.checkTimeConflict(
          dto.roomId,
          dto.meetingDate,
          dto.startTime,
          dto.endTime,
        );

        if (isConflict) {
          throw new BadRequestException('해당 시간대에 이미 예약된 회의가 있습니다.');
        }

        const { ccUserIdxs, attendeeUserIdxs, ...newReservation } = dto;
        // 회의 예약 생성
        const reservationIdx: number = await this.meetingRepository.createReservation(newReservation, userIdx);
        // 회의 참조자 저장
        if (ccUserIdxs?.length > 0) {
          await this.meetingRepository.createParticipants(reservationIdx, ccUserIdxs, ParticipantTypeEnum.CC);
        }
        // 회의 참조자 저장
        if (attendeeUserIdxs?.length > 0) {
          await this.meetingRepository.createParticipants(
            reservationIdx,
            attendeeUserIdxs,
            ParticipantTypeEnum.ATTENDEE,
          );
        }
        await this.redisLockService.delLock(lockKey);
      }
    } catch (err) {
      await this.redisLockService.delLock(lockKey);
      this.logger.error(err);
      throw err;
    }

    return;
  }

  @Transactional()
  async deleteReservation(reservationIdx: number, userIdx: number): Promise<void> {
    const reservationInfo = await this.meetingRepository.getReservation(reservationIdx);
    if (!reservationInfo) {
      throw new BadRequestException('해당 예약 내역은 삭제되었거나 존재하지 않습니다.');
    }
    if (reservationInfo.userIdx !== userIdx) {
      throw new BadRequestException('본인이 예약한 내역만 삭제 가능합니다.');
    }

    await this.meetingRepository.deleteReservation(reservationIdx);

    return;
  }

  async getMeetingSchedule(meetingDate: string) {
    const defaultResult = [
      {
        reservationIdx: null,
        title: null,
        content: null,
        start: null,
        end: null,
        meetingDate: null,
        meetingType: null,
        description: null,
        writerName: null,
        ccUserInfo: [],
        attendeeInfo: [],
      },
    ];
    const reservations = await this.meetingRepository.getMeetingSchedule(meetingDate);
    if (reservations.length === 0) {
      return defaultResult;
    }

    /* reservationIdx 기준 그룹화 + 참조자 및 참석자 정보 합치기 */
    const result = this.groupByReservationIdx(reservations);

    return result;
  }

  private groupByReservationIdx(rows: any[]) {
    return rows.reduce((acc, row) => {
      // 기존 reservationIdx가 있는지 확인
      const existing = acc.find((item: any) => item.reservationIdx === row.reservationIdx);

      const attendeeInfo = {
        attendeeIdx: row.participantIdx,
        attendeeName: row.participantName,
      };
      const ccUserInfo = {
        ccUserIdx: row.participantIdx,
        ccUserName: row.participantName,
      };

      if (existing) {
        // 같은 reservationIdx의 attendeeInfo 리스트에 추가
        if (row.participantIdx && row.participantType === ParticipantTypeEnum.ATTENDEE) {
          const isIdxAlreadyExists = existing.attendeeInfo.some((user: any) => user.attendeeIdx === row.participantIdx);
          if (!isIdxAlreadyExists) {
            existing.attendeeInfo.push(attendeeInfo);
          }
        }
        // 같은 reservationIdx의 ccUserInfo 리스트에 추가
        if (row.participantIdx && row.participantType === ParticipantTypeEnum.CC) {
          const isIdxAlreadyExists = existing.ccUserInfo.some((user: any) => user.ccUserIdx === row.participantIdx);
          if (!isIdxAlreadyExists) {
            existing.ccUserInfo.push(ccUserInfo);
          }
        }
      } else {
        // 새로운 reservationIdx로 새로운 객체 생성
        acc.push({
          reservationIdx: row.reservationIdx,
          writerIdx: row.writerIdx,
          writerName: row.writerName,
          title: row.title,
          content: row.content,
          meetingDate: row.meetingDate,
          start: createKSTTimestamp(row.meetingDate, row.startTime),
          end: createKSTTimestamp(row.meetingDate, row.endTime),
          meetingType: row.meetingType,
          roomId: row.roomId,
          description: row.description,
          attendeeInfo:
            row.participantIdx && row.participantType === ParticipantTypeEnum.ATTENDEE ? [attendeeInfo] : [],
          ccUserInfo: row.participantIdx && row.participantType === ParticipantTypeEnum.CC ? [ccUserInfo] : [],
        });
      }
      return acc;
    }, []);
  }
}
