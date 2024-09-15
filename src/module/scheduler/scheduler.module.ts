import { Logger, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AXIOS_CONFIG } from 'src/config/axios.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HolidayEntity } from 'src/entity/scheduler/holiday.entity';
import { SchedulerRepository } from './repository/scheduler.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([HolidayEntity]),
    ScheduleModule.forRoot(),
    HttpModule.registerAsync(AXIOS_CONFIG),
  ],
  providers: [SchedulerService, SchedulerRepository, Logger],
})
export class SchedulerModule {}
