import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { CommuteService } from './commute.service';
import { CommuteRepository } from './repository/commute.repository';
import { AdminCommuteController, UserCommuteController } from './commute.controller';
import { LeaveModule } from '../leave/leave.module';
import { ApprovalRepository } from '../approval/repository/approval.repository';
import { LeaveStatsEntity } from '../../../entity/intranet/leave/leaveStats.entity';
import { LeaveMonthlyUsageEntity } from '../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from '../../../entity/intranet/leave/leaveUsage.entity';
import { ImageEntity } from '../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../entity/image/commuteHasImage.entity';
import { CommuteApproverEntity } from '../../../entity/intranet/commute/commuteApprover.entity';
import { CommuteCCUserEntity } from '../../../entity/intranet/commute/commuteCCUser.entity';

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
    ]),
    LeaveModule,
  ],
  providers: [CommuteService, CommuteRepository, ApprovalRepository],
  controllers: [UserCommuteController, AdminCommuteController],
})
export class CommuteModule {}
