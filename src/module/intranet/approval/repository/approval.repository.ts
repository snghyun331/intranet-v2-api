import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { Brackets, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum } from '../../../../common/constant/enum';
import * as moment from 'moment';
import { getStartAndEndDateByMonth } from '../../../../common/utils/utility';
import { LeaveMonthlyUsageEntity } from '../../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '../../../../entity/intranet/leave/leaveUsage.entity';
import { UserApprovalFilter } from '../dto/query.dto';
import { LeaveTypeEntity } from '../../../../entity/intranet/leave/leaveType.entity';
import { UserEntity } from '../../../../entity/user/user.entity';
import { ImageEntity } from '../../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../../entity/image/commuteHasImage.entity';

@Injectable()
export class ApprovalRepository {
  constructor(
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
    @InjectRepository(LeaveMonthlyUsageEntity)
    private readonly leaveMonthlyUsageModel: Repository<LeaveMonthlyUsageEntity>,
    @InjectRepository(LeaveUsageEntity) private readonly leaveUsageModel: Repository<LeaveUsageEntity>,
  ) {}

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

  async updateConfirm(commuteIdx: number, confirmPersonIdx: number, confirmYN: ConfirmEnum): Promise<UpdateResult> {
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

    return await this.commuteModel
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
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
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
  ): Promise<UpdateResult> {
    return await this.leaveMonthlyUsageModel
      .createQueryBuilder()
      .update(LeaveMonthlyUsageEntity)
      .set({ monthlyUseCount })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('month = :month', { month })
      .andWhere('leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .execute();
  }

  async updateLeaveAnnualUseCount(year: string, userIdx: number, leaveTypeIdx: number): Promise<UpdateResult> {
    const query = `(
      SELECT COALESCE(SUM(monthly_use_count), 0) 
      FROM leave_monthly_usage  
      WHERE leave_monthly_usage.user_idx = leave_usage.user_idx 
      AND leave_monthly_usage.leave_type_idx = leave_usage.leave_type_idx
      AND leave_monthly_usage.year = leave_usage.year
    )`;

    return await this.leaveUsageModel
      .createQueryBuilder()
      .update(LeaveUsageEntity)
      .set({ annualUseCount: () => query })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .andWhere('leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .execute();
  }

  async updateTotalAnnualLeaveUsage(year: string, userIdx: number): Promise<UpdateResult> {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select('SUM(commuteEntity.leaveReduceUnit)', 'total')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .andWhere('commuteEntity.leaveTypeIdx IN (:...leaveTypeIdx)', {
        leaveTypeIdx: [
          IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE,
          IntranetLeaveTypeIdxEnum.AM_HALF,
          IntranetLeaveTypeIdxEnum.AM_QUARTER,
          IntranetLeaveTypeIdxEnum.PM_HALF,
          IntranetLeaveTypeIdxEnum.PM_QUARTER,
        ],
      })
      .andWhere('YEAR(commuteEntity.commuteDate) = :year', { year })
      .getRawOne();

    const totalAnnualLeaveUsage = result.total || 0;

    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({ totalAnnualLeaveUsage })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }

  async updateTotalSpecialLeaveUsage(year: string, userIdx: number): Promise<UpdateResult> {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select('SUM(commuteEntity.leaveReduceUnit)', 'total')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .andWhere('commuteEntity.leaveTypeIdx IN (:...leaveTypeIdx)', {
        leaveTypeIdx: [
          IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE,
          IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE,
          IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE,
          IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE,
          IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE,
        ],
      })
      .andWhere('YEAR(commuteEntity.commuteDate) = :year', { year })
      .getRawOne();

    const totalSpecialLeaveUsage = result.total || 0;

    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({ totalSpecialLeaveUsage })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }

  async updateTotalAlternativeLeaveUsage(year: string, userIdx: number): Promise<UpdateResult> {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select('SUM(commuteEntity.leaveReduceUnit)', 'total')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .andWhere('commuteEntity.leaveTypeIdx IN (:...leaveTypeIdx)', {
        leaveTypeIdx: [
          IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE,
          IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE,
          IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE,
        ],
      })
      .andWhere('YEAR(commuteEntity.commuteDate) = :year', { year })
      .getRawOne();

    const totalAlternativeLeaveUsage = result.total || 0;

    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({ totalAlternativeLeaveUsage })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
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
        'commuteImageEntity.imageIdx AS imageIdx',
        'imageEntity.imageName AS imageName',
        'imageEntity.imageSize AS imageSize',
        'imageEntity.imageUrl AS imageUrl',
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
      .leftJoin(CommuteHasImageEntity, 'commuteImageEntity', 'commuteImageEntity.commuteIdx = commuteEntity.commuteIdx')
      .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = commuteImageEntity.imageIdx')
      .where('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', { leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL })
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
      .orderBy(`CASE WHEN commuteEntity.confirmYN = '${ConfirmEnum.NO}' THEN 0 ELSE 1 END`, 'ASC')
      .addOrderBy('commuteEntity.commuteDate', 'DESC');

    const result = await query.getRawMany();

    return result;
  }
}
