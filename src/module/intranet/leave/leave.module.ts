import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './repository/leave.repository';
import { AdminLeaveController, UserLeaveController } from './leave.controller';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { AwsModule } from '@aws/aws.module';
import { AwsService } from '@aws/aws.service';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { ApprovalRepository } from '../approval/repository/approval.repository';
import { ImageEntity } from '@entity/image/image.entity';
import { CommuteHasImageEntity } from '@entity/image/commuteHasImage.entity';
import { CommuteApproverEntity } from '@entity/intranet/commute/commuteApprover.entity';
import { CommuteCCUserEntity } from '@entity/intranet/commute/commuteCCUser.entity';
import { LeaveExtraEntity } from '@entity/intranet/leave/leaveExtra.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CommuteEntity,
      LeaveStatsEntity,
      LeaveMonthlyUsageEntity,
      LeaveUsageEntity,
      ImageEntity,
      CommuteHasImageEntity,
      CommuteApproverEntity,
      CommuteCCUserEntity,
      LeaveExtraEntity,
    ]),
    AwsModule,
  ],
  providers: [LeaveService, LeaveRepository, ApprovalRepository, AwsService],
  controllers: [UserLeaveController, AdminLeaveController],
})
export class LeaveModule {}
