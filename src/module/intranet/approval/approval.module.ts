import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalRepository } from './repository/approval.repository';
import { ApprovalService } from './approval.service';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity, LeaveStatsEntity, LeaveMonthlyUsageEntity, LeaveUsageEntity])],
  controllers: [ApprovalController],
  providers: [ApprovalRepository, ApprovalService],
})
export class ApprovalModule {}
