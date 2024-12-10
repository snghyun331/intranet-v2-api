import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DownloadService } from './download.service';
import { DownloadRepository } from './repository/download.repository';
import { DownloadController } from './download.controller';
import { UserEntity } from '../../entity/user/user.entity';
import { MealEntity } from '../../entity/meal/meal.entity';
import { MealStatsEntity } from '../../entity/meal/mealStats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, MealEntity, MealStatsEntity])],
  providers: [DownloadService, DownloadRepository],
  controllers: [DownloadController],
})
export class DownloadModule {}
