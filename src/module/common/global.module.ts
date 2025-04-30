import { Global, Module } from '@nestjs/common';
import { GlobalUserRepository } from './repository/globalUser.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { GlobalHolidayRepository } from './repository/globalHoliday.repository';
import { HolidayEntity } from '../../entity/scheduler/holiday.entity';
import { GlobalMealRepository } from './repository/globalMeal.repository';
import { MealStatsEntity } from '../../entity/meal/mealStats.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, HolidayEntity, MealStatsEntity])],
  providers: [GlobalUserRepository, GlobalHolidayRepository, GlobalMealRepository],
  exports: [GlobalUserRepository, GlobalHolidayRepository, GlobalMealRepository],
})
export class GlobalModule {}
