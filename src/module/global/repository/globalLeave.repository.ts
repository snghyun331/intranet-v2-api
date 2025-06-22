import { Injectable } from '@nestjs/common';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';

@Injectable()
export class GlobalLeaveRepository {
  constructor(@InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>) {}

  async updateLeaveStats(userIdx: number, year: string, newLeaveStats: any): Promise<UpdateResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set(newLeaveStats)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }
}
