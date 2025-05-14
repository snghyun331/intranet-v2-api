import { Module } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealRepository } from './repository/meal.repository';
import { AdminMealController, UserMealController } from './meal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealEntity } from '@entity/meal/meal.entity';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { MealBaseEntity } from '@entity/meal/mealBase.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealEntity, MealStatsEntity, MealBaseEntity])],
  providers: [MealService, MealRepository],
  controllers: [UserMealController, AdminMealController],
})
export class MealModule {}
