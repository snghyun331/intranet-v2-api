import { Module } from '@nestjs/common';
import { AdminWelfareController, UserWelfareController } from './welfare.controller';
import { WelfareService } from './welfare.service';
import { WelfareRepository } from './repository/welfare.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { WelfareEntity } from '../../entity/welfare/welfare.entity';
import { WelfareStatsEntity } from '../../entity/welfare/welfareStats.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WelfareEntity, WelfareStatsEntity])],
  providers: [WelfareService, WelfareRepository],
  controllers: [UserWelfareController, AdminWelfareController],
})
export class WelfareModule {}
