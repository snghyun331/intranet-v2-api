import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, Repository, UpdateResult } from 'typeorm';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';
import { ConfirmEnum } from '../../../../common/constant/enum';
import * as moment from 'moment';
import { getStartAndEndDateByMonth } from '../../../../common/utils/utility';
import { LeaveMonthlyUsageEntity } from '../../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '../../../../entity/intranet/leave/leaveUsage.entity';

@Injectable()
export class ApprovalRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async getCommuteCountByIdx(commuteIdx: number): Promise<number> {
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEntity.commuteIdx', { commuteIdx })
      .getCount();

    return result;
  }

  async getCommuteInfoWithApprover(commuteIdx: number) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteApproverEntity.userIdx AS approverIdx',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .leftJoin(
        CommuteApproverEntity,
        'commuteApproverEntity',
        'commuteApproverEntity.commuteIdx = commuteEntity.commuteIdx',
      )
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawMany();

    return result;
  }

  async updateConfirm(
    commuteIdx: number,
    confirmPersonIdx: number,
    confirmYN: ConfirmEnum,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    const confirmYNDateInfo = { confirmDate: null, rejectDate: null };
    switch (confirmYN) {
      case ConfirmEnum.YES:
        confirmYNDateInfo.confirmDate = moment().utcOffset(9).format('YYYY-MM-DD');
        break;
      case ConfirmEnum.REJECT:
        confirmYNDateInfo.rejectDate = moment().utcOffset(9).format('YYYY-MM-DD');
        break;
      default:
        break;
    }

    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ confirmYN, confirmPersonIdx, ...confirmYNDateInfo })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async getTotalLeaveCountForMonth(
    year: number,
    month: number,
    userIdx: number,
    leaveTypeIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    console.log(startDate);
    console.log(endDate);
    console.log(userIdx);
    console.log(leaveTypeIdx);
    const result: number = await manager
      .createQueryBuilder(CommuteEntity, 'commuteEntity')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .getCount();

    console.log(result);

    return result;
  }

  async updateLeaveMonthlyUseCount(
    year: string,
    month: string,
    userIdx: number,
    leaveTypeIdx: number,
    monthlyUseCount: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(LeaveMonthlyUsageEntity)
      .set({ monthlyUseCount })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .andWhere('leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .execute();
  }

  async updateLeaveAnnualUseCount(
    year: string,
    userIdx: number,
    leaveTypeIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    const query = `(
      SELECT COALESCE(SUM(monthly_use_count), 0) 
      FROM leave_monthly_usage  
      WHERE leave_monthly_usage.user_idx = leave_usage.user_idx 
      AND leave_monthly_usage.leave_type_idx = leave_usage.leave_type_idx
      AND leave_monthly_usage.year = leave_usage.year
    )`;

    return await manager
      .createQueryBuilder()
      .update(LeaveUsageEntity)
      .set({ annualUseCount: () => query })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .execute();
  }

  async updateTotalAnnualLeaveUsage(year: string, userIdx: number, manager: EntityManager): Promise<UpdateResult> {
    const query = `(
      SELECT SUM(
        CASE 
          WHEN leave_usage.leave_type_idx IN (2, 3) THEN leave_usage.annual_use_count * 0.5
          WHEN leave_usage.leave_type_idx IN (4, 5) THEN leave_usage.annual_use_count * 0.25
          WHEN leave_usage.leave_type_idx = 6 THEN leave_usage.annual_use_count
          ELSE 0
        END
      )
      FROM leave_usage
      WHERE leave_usage.user_idx = leave_stats.user_idx 
      AND leave_usage.year = leave_stats.year
    )`;

    return await manager
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({
        totalAnnualLeaveUsage: () => query,
      })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }
}
