import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { CommuteService } from './commute.service';
import { CommuteRepository } from './repository/commute.repository';
import { AdminCommuteController, UserCommuteController } from './commute.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity])],
  providers: [CommuteService, CommuteRepository],
  controllers: [UserCommuteController, AdminCommuteController],
})
export class CommuteModule {}
