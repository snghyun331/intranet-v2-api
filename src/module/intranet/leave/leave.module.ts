import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveEntity } from '../../../entity/intranet/leave/leave.entity';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './repository/leave.repository';
import { UserLeaveController } from './leave.controller';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';
import { AwsModule } from '../../aws/aws.module';
import { AwsService } from '../../aws/aws.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity, LeaveEntity]), AwsModule],
  providers: [LeaveService, LeaveRepository, AwsService],
  controllers: [UserLeaveController],
})
export class LeaveModule {}
