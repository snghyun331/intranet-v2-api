import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { CommuteService } from './commute.service';
import { CommuteRepository } from './repository/commute.repository';
import { AdminCommuteController, UserCommuteController } from './commute.controller';
import { LeaveModule } from '../leave/leave.module';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity]), LeaveModule],
  providers: [CommuteService, CommuteRepository],
  controllers: [UserCommuteController, AdminCommuteController],
})
export class CommuteModule {}
