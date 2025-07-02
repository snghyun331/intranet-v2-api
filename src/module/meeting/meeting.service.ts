import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { MeetingRepository } from './repository/meeting.repository';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';
import { RedisLockService } from '../redis/redisLock.service';
import { MEETING_RESERVE_LOCK_DURATION } from '@common/constant/constant';
import { ParticipantTypeEnum } from '@common/constant/enum';
import { Transactional } from 'typeorm-transactional';
import { createKSTTimestamp } from '../../common/utils/utility';
import { UpdateMeetingReservationDto } from './dto/updateMeeting.dto';

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
        const { ccUserIdxs, attendeeUserIdxs, ...newReservation } = dto;
        /* 유효성 검증 */
        // 시간 충돌 여부
        const isConflict: boolean = await this.meetingRepository.checkTimeConflict(
          dto.roomId,
          dto.meetingDate,
          dto.startTime,
          dto.endTime,
        );
        if (isConflict) {
          throw new BadRequestException('해당 시간대에 이미 예약된 회의가 있습니다.');
        }
        // 참석자와 참조자에 동일한 사람 포함 X
        const ccUserSet = new Set(ccUserIdxs);
        for (const attendeeIdx of attendeeUserIdxs) {
          if (ccUserSet.has(attendeeIdx)) {
            throw new BadRequestException('참석자와 참조자에 동일한 사용자가 포함될 수 없습니다.');
          }
        }
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
    const reservationInfo = await this.meetingRepository.getReservationByIdx(reservationIdx);
    if (!reservationInfo) {
      throw new BadRequestException('해당 예약 내역은 삭제되었거나 존재하지 않습니다.');
    }
    if (reservationInfo.userIdx !== userIdx) {
      throw new BadRequestException('본인이 예약한 내역만 삭제 가능합니다.');
    }

    await this.meetingRepository.deleteReservation(reservationIdx);

    return;
  }

  @Transactional()
  async updateReservation(dto: UpdateMeetingReservationDto, userIdx: number, reservationIdx: number): Promise<void> {
    const lockKey = `meeting:room:${dto.roomId}:date:${dto.meetingDate}:time:${dto.startTime}-${dto.endTime}`;
    const lock: boolean = await this.redisLockService.waitAndSetLock(lockKey, MEETING_RESERVE_LOCK_DURATION);

    try {
      if (lock) {
        const { ccUserIdxs, attendeeUserIdxs, ...newReservation } = dto;
        /* 유효성 검증 */
        // 에약 내역 존재 여부
        const reservationInfo = await this.meetingRepository.getReservationByIdx(reservationIdx);
        if (!reservationInfo) {
          throw new BadRequestException('존재하지 않거나 삭제된 내역입니다.');
        }
        // 본인이 작성한 내역만 수정 가능
        if (reservationInfo.userIdx !== userIdx) {
          throw new BadRequestException('본인이 작성한 내역만 수정할 수 있습니다.');
        }
        // 시간 충돌 여부
        const isConflict: boolean = await this.meetingRepository.checkTimeConflict(
          dto.roomId,
          dto.meetingDate,
          dto.startTime,
          dto.endTime,
          reservationIdx,
        );
        if (isConflict) {
          throw new BadRequestException('해당 시간대에 이미 예약된 회의가 있습니다.');
        }
        // 참석자와 참조자에 동일한 사람 포함 X
        const ccUserSet = new Set(ccUserIdxs);
        for (const attendeeIdx of attendeeUserIdxs) {
          if (ccUserSet.has(attendeeIdx)) {
            throw new BadRequestException('참석자와 참조자에 동일한 사용자가 포함될 수 없습니다.');
          }
        }

        /* 회의 예약 업데이트 */
        await this.meetingRepository.updateReservation(reservationIdx, newReservation);

        /* 참석자 및 참조자 업데이트 */
        const existAttendeeIdxList: number[] = await this.meetingRepository.getMeetingAttendeeIdxs(reservationIdx);
        const existCCUserIdxList: number[] = await this.meetingRepository.getMeetingCCUserIdxs(reservationIdx);
        if (ccUserIdxs !== existCCUserIdxList || existAttendeeIdxList !== attendeeUserIdxs) {
          const newParticipants = [
            ...attendeeUserIdxs.map((userIdx) => ({
              reservationIdx,
              userIdx,
              participantType: ParticipantTypeEnum.ATTENDEE,
            })),
            ...ccUserIdxs.map((userIdx) => ({ reservationIdx, userIdx, participantType: ParticipantTypeEnum.CC })),
          ];
          console.log(newParticipants);
          await this.meetingRepository.deleteParticipants(reservationIdx);

          await this.meetingRepository.createParticipant(newParticipants);
        }

        await this.redisLockService.delLock(lockKey);

        // /* attendeeIdxs 처리 */
        // // 기존 attendeeIdx 목록 가져오기
        // const existAttendeeIdxList: number[] = await this.meetingRepository.getMeetingAttendeeIdxs(reservationIdx);
        // console.log('existAttendeeIdxList', existAttendeeIdxList);
        // // 제거할 attendeeIdx 목록 계산
        // const attendeeIdxToRemove: number[] = existAttendeeIdxList.filter(
        //   (attendeeIdx) => !attendeeUserIdxs.includes(attendeeIdx),
        // );
        // console.log('attendeeIdxToRemove', attendeeIdxToRemove);
        // // 새로 추가할 attendeeIdx 목록 계산
        // const attendeeIdxToAdd: number[] = attendeeUserIdxs.filter(
        //   (attendeeIdx) => !existAttendeeIdxList.includes(attendeeIdx),
        // );
        // console.log('attendeeIdxToAdd', attendeeIdxToAdd);
        // // 삭제할 attendee 처리
        // if (attendeeIdxToRemove.length > 0) {
        //   await this.meetingRepository.deleteMeetingAttendeeList(reservationIdx, attendeeIdxToRemove);
        // }
        // // 추가할 attendee 처리
        // if (attendeeIdxToAdd.length > 0) {
        //   await this.meetingRepository.createMeetingAttendeeList(reservationIdx, attendeeIdxToAdd);
        // }

        // /* ccUserIdxs 처리 */
        // // 기존 ccUserIdx 목록 가져오기
        // const existCCUserIdxList: number[] = await this.meetingRepository.getMeetingCCUserIdxs(reservationIdx);
        // console.log('existCCUserIdxList', existCCUserIdxList);
        // // 제거할 ccUserIdx 목록 계산
        // const ccUserIdxToRemove: number[] = existCCUserIdxList.filter((ccUserIdx) => !ccUserIdxs.includes(ccUserIdx));
        // console.log('ccUserIdxToRemove', ccUserIdxToRemove);
        // // 새로 추가할 ccUserIdx 목록 계산
        // const ccUserIdxToAdd: number[] = ccUserIdxs.filter((ccUserIdx) => !existCCUserIdxList.includes(ccUserIdx));
        // console.log('ccUserIdxToAdd', ccUserIdxToAdd);
        // // 삭제할 ccUser 처리
        // if (ccUserIdxToRemove.length > 0) {
        //   await this.meetingRepository.deleteMeetingCCUserList(reservationIdx, ccUserIdxToRemove);
        // }
        // // 추가할 ccUser 처리
        // if (ccUserIdxToAdd.length > 0) {
        //   await this.meetingRepository.createMeetingCCUserList(reservationIdx, ccUserIdxToAdd);
        // }
      }
    } catch (err) {
      await this.redisLockService.delLock(lockKey);
      this.logger.error(err);
      throw err;
    }
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
    const result = await this.groupByReservationIdx(reservations);

    return result;
  }

  private async groupByReservationIdx(rows: any[]) {
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
