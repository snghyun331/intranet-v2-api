import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveStatsEntity } from '../../../entity/intranet/leave/leaveStats.entity';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './repository/leave.repository';
import { AdminLeaveController, UserLeaveController } from './leave.controller';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';
import { AwsModule } from '../../aws/aws.module';
import { AwsService } from '../../aws/aws.service';
import { UserEntity } from '../../../entity/user/user.entity';
import { LeaveMontlyStatsEntity } from '../../../entity/intranet/leave/leaveMonthlyStats.entity';
import { CommuteConfirmableEntity } from '../../../entity/intranet/commute/commuteConfirmable.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommuteEntity,
      CommuteConfirmableEntity,
      LeaveStatsEntity,
      LeaveMontlyStatsEntity,
      UserEntity,
    ]),
    AwsModule,
  ],
  providers: [LeaveService, LeaveRepository, AwsService],
  controllers: [UserLeaveController, AdminLeaveController],
})
export class LeaveModule {}
