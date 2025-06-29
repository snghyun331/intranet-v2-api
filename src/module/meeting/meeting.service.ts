import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { MeetingRepository } from './repository/meeting.repository';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';
import { RedisLockService } from '../redis/redisLock.service';
import { MEETING_RESERVE_LOCK_DURATION } from '@common/constant/constant';
import { ParticipantTypeEnum } from '@common/constant/enum';
import { Transactional } from 'typeorm-transactional';

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
    const lockKey = `meeting:room:${dto.roomIdx}:date:${dto.meetingDate}:time:${dto.startTime}-${dto.endTime}`;
    const lock: boolean = await this.redisLockService.waitAndSetLock(lockKey, MEETING_RESERVE_LOCK_DURATION);

    try {
      if (lock) {
        // 시간 충돌 검사
        const isConflict: boolean = await this.meetingRepository.checkTimeConflict(
          dto.roomIdx,
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
}
