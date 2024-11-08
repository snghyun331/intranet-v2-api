import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityService } from './activity.service';
import { ActivityRepository } from './repository/activity.repository';
import { ActivityController } from './activity.controller';
import { UserEntity } from '../../entity/user/user.entity';
import { ActivityEntity } from '../../entity/activity/activity.entity';
import { ActivityMonthlyStatsEntity } from '../../entity/activity/activityMonthlyStats.entity';
import { ActivityStatsEntity } from '../../entity/activity/activityStats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ActivityEntity, ActivityMonthlyStatsEntity, ActivityStatsEntity])],
  providers: [ActivityService, ActivityRepository],
  controllers: [ActivityController],
})
export class ActivityModule {}
