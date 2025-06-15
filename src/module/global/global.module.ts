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

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, AdminEntity, HolidayEntity, MealStatsEntity, CommuteEntity])],
  providers: [GlobalUserRepository, GlobalHolidayRepository, GlobalMealRepository, GlobalCommuteRepository],
  exports: [GlobalUserRepository, GlobalHolidayRepository, GlobalMealRepository, GlobalCommuteRepository],
})
export class GlobalModule {}
