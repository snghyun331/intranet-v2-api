import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveEntity } from '../../../entity/intranet/leave/leave.entity';
import { LeaveService } from './leave.service';
import { LeaveRepository } from './repository/leave.repository';
import { UserLeaveController } from './leave.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveEntity])],
  providers: [LeaveService, LeaveRepository],
  controllers: [UserLeaveController],
})
export class LeaveModule {}
