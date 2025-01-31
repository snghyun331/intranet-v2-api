import { Module } from '@nestjs/common';
import { CommuteModule } from './commute/commute.module';
import { LeaveModule } from './leave/leave.module';

@Module({
  imports: [CommuteModule, LeaveModule],
})
export class IntranetModule {}
