import { Module } from '@nestjs/common';
import { CommuteModule } from './commute/commute.module';
import { LeaveModule } from './leave/leave.module';
import { ApprovalModule } from './approval/approval.module';

@Module({
  imports: [CommuteModule, LeaveModule, ApprovalModule],
})
export class IntranetModule {}
