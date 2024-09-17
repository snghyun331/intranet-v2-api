import { Module } from '@nestjs/common';
import { MealService } from './meal.service';
import { MealRepository } from './repository/meal.repository';
import { MealController } from './meal.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MealEntity } from '../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../entity/meal/mealStats.entity';
import { UserEntity } from '../../entity/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MealEntity, MealStatsEntity, UserEntity])],
  providers: [MealService, MealRepository],
  controllers: [MealController],
})
export class MealModule {}
