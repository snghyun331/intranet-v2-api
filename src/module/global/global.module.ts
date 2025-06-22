import { Global, Module } from '@nestjs/common';
import { GlobalUserRepository } from './repository/globalUser.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { GlobalHolidayRepository } from './repository/globalHoliday.repository';
import { HolidayEntity } from '@entity/scheduler/holiday.entity';
import { GlobalMealRepository } from './repository/globalMeal.repository';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { AdminEntity } from '../../entity/admin/admin.entity';
import { CommuteEntity } from '../../entity/intranet/commute/commute.entity';
import { GlobalCommuteRepository } from './repository/globalCommute.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../schema/user/user.schema';
import { GlobalPlayGroundModel } from './model/globalPlayground.model';
import { GlobalLeaveRepository } from './repository/globalLeave.repository';
import { LeaveStatsEntity } from '../../entity/intranet/leave/leaveStats.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      AdminEntity,
      HolidayEntity,
      MealStatsEntity,
      CommuteEntity,
      LeaveStatsEntity,
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    GlobalUserRepository,
    GlobalHolidayRepository,
    GlobalMealRepository,
    GlobalCommuteRepository,
    GlobalLeaveRepository,
    GlobalPlayGroundModel,
  ],
  exports: [
    GlobalUserRepository,
    GlobalHolidayRepository,
    GlobalMealRepository,
    GlobalCommuteRepository,
    GlobalLeaveRepository,
    GlobalPlayGroundModel,
  ],
})
export class GlobalModule {}
