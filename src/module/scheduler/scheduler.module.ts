import { Logger, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AXIOS_CONFIG } from '@config/axios.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayEntity } from '@entity/scheduler/holiday.entity';
import { SchedulerRepository } from './repository/scheduler.repository';
import { UserEntity } from '@entity/user/user.entity';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { ActivityMonthlyStatsEntity } from '../../entity/activity/activityMonthlyStats.entity';
import { ActivityStatsEntity } from '../../entity/activity/activityStats.entity';
import { PlayGroundModel } from '../playground/model/playground.model';
import { MongooseModule } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigSchema } from '../../schema/lunchGroup/lunchGroupConfig.schema';
import { LunchGroupMember, LunchGroupMemberSchema } from '../../schema/lunchGroup/lunchGroupMember.schema';
import { BaverageConfig, BaverageConfigSchema } from '../../schema/baverage/baverageConfig.schema';
import { BaverageMember, BaverageMemberSchema } from '../../schema/baverage/baverageMember.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HolidayEntity,
      UserEntity,
      LeaveStatsEntity,
      LeaveUsageEntity,
      LeaveMonthlyUsageEntity,
      ActivityMonthlyStatsEntity,
      ActivityStatsEntity,
    ]),
    MongooseModule.forFeature([
      { name: LunchGroupConfig.name, schema: LunchGroupConfigSchema },
      { name: LunchGroupMember.name, schema: LunchGroupMemberSchema },
      { name: BaverageConfig.name, schema: BaverageConfigSchema },
      { name: BaverageMember.name, schema: BaverageMemberSchema },
    ]),
    ScheduleModule.forRoot(),
    HttpModule.registerAsync(AXIOS_CONFIG),
  ],
  providers: [SchedulerService, SchedulerRepository, PlayGroundModel, Logger],
})
export class SchedulerModule {}
