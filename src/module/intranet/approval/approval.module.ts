import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';
import { ApprovalController } from './approval.controller';
import { ApprovalRepository } from './repository/approval.repository';
import { ApprovalService } from './approval.service';

@Module({
  imports: [TypeOrmModule.forFeature([CommuteEntity])],
  controllers: [ApprovalController],
  providers: [ApprovalRepository, ApprovalService],
})
export class ApprovalModule {}
