import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingParticipantEntity } from '@entity/meeting/mettingParticipant.entity';
import { MeetingReservationEntity } from '@entity/meeting/meetingReservation.entity';
import { MeetingRoomEntity } from '@entity/meeting/meettingRoom.entity';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { MeetingRepository } from './repository/meeting.repository';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisLockService } from '../redis/redisLock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingParticipantEntity, MeetingReservationEntity, MeetingRoomEntity]),
    RedisModule,
  ],
  controllers: [MeetingController],
  providers: [MeetingService, MeetingRepository, RedisLockService, Logger],
})
export class MeetingModule {}
