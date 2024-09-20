import { Logger, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AXIOS_CONFIG } from '../../config/axios.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayEntity } from '../../entity/scheduler/holiday.entity';
import { SchedulerRepository } from './repository/scheduler.repository';
import { UserEntity } from '../../entity/user/user.entity';
import { MealStatsEntity } from '../../entity/meal/mealStats.entity';
import { WeekendEntity } from '../../entity/scheduler/weekend.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([HolidayEntity, UserEntity, MealStatsEntity, WeekendEntity]),
    ScheduleModule.forRoot(),
    HttpModule.registerAsync(AXIOS_CONFIG),
  ],
  providers: [SchedulerService, SchedulerRepository, Logger],
})
export class SchedulerModule {}
