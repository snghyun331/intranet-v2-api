import { Module } from '@nestjs/common';
import { WelfareController } from './welfare.controller';
import { WelfareService } from './welfare.service';
import { WelfareRepository } from './repository/welfare.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { WelfareEntity } from '../../entity/welfare/welfare.entity';
import { WelfareStatsEntity } from '../../entity/welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '../../entity/welfare/welfareMonthlyStats.entity';
import { WelfarePayeeEntity } from '../../entity/welfare/payee.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      WelfareEntity,
      WelfareStatsEntity,
      WelfareMonthlyStatsEntity,
      WelfarePayeeEntity,
    ]),
  ],
  providers: [WelfareService, WelfareRepository],
  controllers: [WelfareController],
})
export class WelfareModule {}
