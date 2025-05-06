import { Logger, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AXIOS_CONFIG } from '@config/axios.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayEntity } from '@entity/scheduler/holiday.entity';
import { SchedulerRepository } from './repository/scheduler.repository';
import { UserEntity } from '@entity/user/user.entity';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { WelfareStatsEntity } from '@entity/welfare/welfareStats.entity';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HolidayEntity,
      UserEntity,
      MealStatsEntity,
      WelfareStatsEntity,
      LeaveStatsEntity,
      LeaveUsageEntity,
      LeaveMonthlyUsageEntity,
    ]),
    ScheduleModule.forRoot(),
    HttpModule.registerAsync(AXIOS_CONFIG),
  ],
  providers: [SchedulerService, SchedulerRepository, Logger],
})
export class SchedulerModule {}
