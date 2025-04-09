import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { Brackets, EntityManager, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';
import { ConfirmEnum } from '../../../../common/constant/enum';
import * as moment from 'moment';
import { getStartAndEndDateByMonth } from '../../../../common/utils/utility';
import { LeaveMonthlyUsageEntity } from '../../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '../../../../entity/intranet/leave/leaveUsage.entity';
import { UserApprovalFilter } from '../dto/query.dto';
import { LeaveTypeEntity } from '../../../../entity/intranet/leave/leaveType.entity';
import { UserEntity } from '../../../../entity/user/user.entity';
import { MealStatsEntity } from '../../../../entity/meal/mealStats.entity';

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
        'commuteApproverEntity.approverIdx AS approverIdx',
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
    year: string,
    month: string,
    userIdx: number,
    leaveTypeIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: number = await manager
      .createQueryBuilder(CommuteEntity, 'commuteEntity')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .getCount();

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

  async updateTotalSpecialLeaveUsage(year: string, userIdx: number, manager: EntityManager): Promise<UpdateResult> {
    const query = `(
      SELECT SUM(
        CASE 
          WHEN leave_usage.leave_type_idx IN (8, 9) THEN leave_usage.annual_use_count * 0.5
          WHEN leave_usage.leave_type_idx IN (10, 11) THEN leave_usage.annual_use_count * 0.25
          WHEN leave_usage.leave_type_idx = 7 THEN leave_usage.annual_use_count
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
        totalSpecialLeaveUsage: () => query,
      })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }

  async updateTotalAlternativeLeaveUsage(year: string, userIdx: number, manager: EntityManager): Promise<UpdateResult> {
    const query = `(
      SELECT SUM(
        CASE 
          WHEN leave_usage.leave_type_idx IN (13, 14) THEN leave_usage.annual_use_count * 0.5
          WHEN leave_usage.leave_type_idx = 12 THEN leave_usage.annual_use_count
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
        totalAlternativeLeaveUsage: () => query,
      })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }

  async updateMealTimeOffDays(
    year: string,
    month: string,
    userIdx: number,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const query = `(
      SELECT COUNT(DISTINCT(c.commute_date)) 
      FROM commute c
      WHERE c.user_idx = ${userIdx}
      AND c.confirm_yn = '${ConfirmEnum.YES}'
      AND c.commute_date BETWEEN '${startDate}' AND '${endDate}'
      AND c.leave_type_idx NOT IN (1,4,5,10,11)
    )`;

    return await manager
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({
        timeoffDays: () => query,
      })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .execute();
  }

  async getApprovalHistory(userIdx: number, filterInfo: UserApprovalFilter) {
    const { year, month } = filterInfo;
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteEntity.note AS note',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.confirmDate AS confirmDate',
        'commuteEntity.rejectDate AS rejectDate',
        'commuteEntity.confirmPersonIdx AS confirmPersonIdx',
        'commuteEntity.createdAt AS createdAt',
        `
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM commute_approver approverEntity 
              WHERE approverEntity.commute_idx = commuteEntity.commute_idx AND approverEntity.approver_idx = ${userIdx}
            ) THEN 'APPROVER'
            WHEN EXISTS (
              SELECT 1 FROM commute_cc_user ccUserEntity 
              WHERE ccUserEntity.commute_idx = commuteEntity.commute_idx AND ccUserEntity.cc_user_idx = ${userIdx}
            ) THEN 'CC'
            ELSE '-' 
          END AS relationType
        `,
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = commuteEntity.userIdx')
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .where('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere(
        new Brackets((qb) => {
          qb.where(`
            EXISTS (
              SELECT 1 FROM commute_cc_user ccUserEntity 
              WHERE ccUserEntity.commute_idx = commuteEntity.commute_idx AND ccUserEntity.cc_user_idx = ${userIdx}
            )
        `).orWhere(`
            EXISTS (
              SELECT 1 FROM commute_approver approverEntity 
              WHERE approverEntity.commute_idx = commuteEntity.commute_idx AND approverEntity.approver_idx = ${userIdx}
            )
        `);
        }),
      );

    if (filterInfo.userIdx) {
      query.andWhere('commuteEntity.userIdx = :userIdx', { userIdx: filterInfo.userIdx });
    }

    query
      .orderBy(`CASE WHEN commuteEntity.confirmYN = '${ConfirmEnum.YES}' THEN 1 ELSE 0 END`, 'ASC')
      .addOrderBy('commuteEntity.createdAt', 'ASC');

    const result = await query.getRawMany();

    return result;
  }
}
