import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveStatsEntity } from '../../../entity/intranet/leave/leaveStats.entity';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './repository/leave.repository';
import { AdminLeaveController, UserLeaveController } from './leave.controller';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';
import { AwsModule } from '../../aws/aws.module';
import { AwsService } from '../../aws/aws.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity, LeaveStatsEntity]), AwsModule],
  providers: [LeaveService, LeaveRepository, AwsService],
  controllers: [UserLeaveController, AdminLeaveController],
})
export class LeaveModule {}
