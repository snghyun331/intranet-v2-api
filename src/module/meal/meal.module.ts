import { Module } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealRepository } from './repository/meal.repository';
import { AdminMealController, UserMealController } from './meal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealEntity } from '../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../entity/meal/mealStats.entity';
import { UserEntity } from '../../entity/user/user.entity';
import { HolidayEntity } from '../../entity/scheduler/holiday.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealEntity, MealStatsEntity, UserEntity, HolidayEntity])],
  providers: [MealService, MealRepository],
  controllers: [UserMealController, AdminMealController],
})
export class MealModule {}
