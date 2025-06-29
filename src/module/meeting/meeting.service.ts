import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { MeetingRepository } from './repository/meeting.repository';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';
import { RedisLockService } from '../redis/redisLock.service';
import { MEETING_RESERVE_LOCK_DURATION } from '@common/constant/constant';
import { ParticipantTypeEnum } from '@common/constant/enum';
import { Transactional } from 'typeorm-transactional';
import { AttendeeInfo, CcUserInfo, RoomSchedule, TimeSlotInfo } from './interface/meeting.interface';

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

  async getAvailableRoom() {
    const result = await this.meetingRepository.getAvailableRooms();

    return result;
  }

  async getMeetingSchedule(meetingDate: string) {
    /* 1. 해당 날짜의 모든 예약 정보 조회 */
    const reservations = await this.meetingRepository.getMeetingSchedule(meetingDate);
    /* 2. 모든 활성 회의실 정보 조회 */
    const rooms = await this.meetingRepository.getAvailableRooms();
    /* 3. 시간대별 스케줄 생성 (8시~19시) */
    const timeSlots = await this.generateTimeSlots();
    /* 4. 회의실별로 스케줄 구성 */
    const roomSchedules: RoomSchedule[] = rooms.map((room) => {
      // 해당 회의실의 예약들만 필터링
      const roomReservations = reservations.filter((reservation) => reservation.roomIdx === room.roomIdx);
      // 각 시간대별로 예약 상태 확인
      const slots: TimeSlotInfo[] = timeSlots.map((time) => {
        const conflictingMeeting = roomReservations.find((reservation) =>
          this.isTimeInMeetingRange(time, reservation.startTime, reservation.endTime),
        );
        return {
          time,
          isAvailable: !conflictingMeeting,
          meeting: conflictingMeeting
            ? {
                reservationIdx: conflictingMeeting.reservationIdx,
                title: conflictingMeeting.title,
                content: conflictingMeeting.content,
                startTime: conflictingMeeting.startTime,
                endTime: conflictingMeeting.endTime,
                meetingDate: conflictingMeeting.meetingDate,
                meetingType: conflictingMeeting.meetingType,
                description: conflictingMeeting.description,
                writerName: conflictingMeeting.writerName,
                ccUserInfo: this.extractCcUsers(reservations, conflictingMeeting.reservationIdx),
                attendeeInfo: this.extractAttendees(reservations, conflictingMeeting.reservationIdx),
              }
            : null,
        };
      });

      return {
        roomIdx: room.roomIdx,
        roomName: room.roomName,
        capacity: room.capacity,
        timeSlots: slots,
      };
    });

    return {
      meetingDate,
      rooms: roomSchedules,
    };
  }

  /**
   * 8시부터 19시까지 30분 간격으로 시간대 생성
   */
  private generateTimeSlots(): string[] {
    const slots: string[] = [];

    for (let hour = 8; hour <= 19; hour++) {
      // 정시 (00분)
      slots.push(`${hour.toString().padStart(2, '0')}:00`);

      // 30분 (19시는 30분 제외)
      if (hour < 19) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }

    return slots;
  }

  /**
   * 특정 시간이 회의 시간 범위에 포함되는지 확인
   */
  private isTimeInMeetingRange(time: string, startTime: string, endTime: string): boolean {
    // 시간을 분 단위로 변환하여 비교
    const timeMinutes = this.timeToMinutes(time);
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // 해당 시간이 회의 시간 범위 내에 있는지 확인
    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  /**
   * 시간 문자열을 분 단위로 변환
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  /**
   * CC 타입 참석자 추출
   */
  private extractCcUsers(reservations: any[], reservationIdx: number): CcUserInfo[] {
    const participants = reservations.filter(
      (reservation) =>
        reservation.reservationIdx === reservationIdx &&
        reservation.participantType === ParticipantTypeEnum.CC &&
        reservation.participantIdx,
    );

    // 중복 제거
    const uniqueParticipants = participants.reduce((acc, current) => {
      const existingParticipant = acc.find((p) => p.participantIdx === current.participantIdx);
      if (!existingParticipant) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueParticipants.map((participant) => ({
      ccUserIdx: participant.participantIdx,
      ccUserName: participant.participantName,
    }));
  }

  /**
   * ATTENDEE 타입 참석자 추출
   */
  private extractAttendees(reservations: any[], reservationIdx: number): AttendeeInfo[] {
    const participants = reservations.filter(
      (reservation) =>
        reservation.reservationIdx === reservationIdx &&
        reservation.participantType === ParticipantTypeEnum.ATTENDEE &&
        reservation.participantIdx,
    );

    // 중복 제거
    const uniqueParticipants = participants.reduce((acc, current) => {
      const existingParticipant = acc.find((p) => p.participantIdx === current.participantIdx);
      if (!existingParticipant) {
        acc.push(current);
      }
      return acc;
    }, []);

    return uniqueParticipants.map((participant) => ({
      attendeeIdx: participant.participantIdx,
      attendeeName: participant.participantName,
    }));
  }
}
