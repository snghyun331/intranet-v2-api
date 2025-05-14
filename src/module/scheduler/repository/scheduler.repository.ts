import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, InsertResult, Repository, UpdateResult } from 'typeorm';
import { HolidayEntity } from '@entity/scheduler/holiday.entity';
import { UserEntity } from '@entity/user/user.entity';
import { HolidayInfo } from '@scheduler/interface/holiday.interface';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { NewLeaveStats } from '@scheduler/interface/leaveStats.interface';
import { YNEnum } from '../../../common/constant/enum';

@Injectable()
export class SchedulerRepository {
  constructor(
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
    @InjectRepository(LeaveUsageEntity) private readonly leaveUsageModel: Repository<LeaveUsageEntity>,
    @InjectRepository(LeaveMonthlyUsageEntity)
    private readonly leaveMonthlyUsageModel: Repository<LeaveMonthlyUsageEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async getAllUsersInfo(): Promise<UserEntity[]> {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.joinDate AS joinDate'])
      .where('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    return result;
  }

  async getAllUserWithLessThanOneYear(today: string): Promise<UserEntity[]> {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.joinDate AS joinDate'])
      .where(`DATEDIFF(${today}, userEntity.joinDate) <= 365`)
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    return result;
  }

  async getUserLeaveStatsInfo(userIdx: number, year: string) {
    const statsInfo = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance',
        'leaveStatsEntity.midJoinReceivedAnnualLeave AS midJoinReceivedAnnualLeave',
      ])
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    const result = {
      totalReceivedAnnualLeave: statsInfo?.totalReceivedAnnualLeave ?? 0,
      totalAnnualLeaveUsage: statsInfo?.totalAnnualLeaveUsage ?? 0,
      totalAnnualLeaveBalance: Number(statsInfo?.totalAnnualLeaveBalance ?? 0),
      midJoinReceivedAnnualLeave: statsInfo?.midJoinReceivedAnnualLeave ?? 0,
    };

    return result;
  }

  async insertHolidayInfo(holidayInfo: HolidayInfo): Promise<void> {
    await this.holidayModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(HolidayEntity).values(holidayInfo).execute();
    });
  }

  async insertCommutesForToday(): Promise<void> {
    await this.dataSource.query(`INSERT INTO commute (user_idx, commute_date)
      SELECT u.user_idx,  CURDATE()
      FROM user u
      WHERE u.user_avail = 'Y'
        AND NOT EXISTS (
        SELECT 1 FROM commute c
        WHERE c.user_idx = u.user_idx AND c.commute_date = CURDATE()
      );
    `);

    return;
  }

  async insertLeaveStatsInfo(userIdx: number, year: string, newLeaveStats: NewLeaveStats): Promise<InsertResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .insert()
      .into(LeaveStatsEntity)
      .values({ userIdx, year, ...newLeaveStats })
      .execute();
  }

  async updateLeaveStatsInfo(userIdx: number, year: string, newLeaveStats: NewLeaveStats): Promise<UpdateResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set(newLeaveStats)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }

  async insertLeaveUsageInfo(userIdx: number, year: string): Promise<void> {
    // 휴가유형별
    for (let i = 2; i <= 20; i++) {
      const leaveTypeIdx: number = i;
      await this.leaveUsageModel
        .createQueryBuilder()
        .insert()
        .into(LeaveUsageEntity)
        .values({ userIdx, year, leaveTypeIdx })
        .execute();
    }
  }

  async insertLeaveMonthlyUsageInfo(userIdx: number, year: string): Promise<void> {
    // 월별
    for (let i = 1; i <= 12; i++) {
      const month: string = i.toString();
      // 휴가 유형별
      for (let j = 2; j <= 20; j++) {
        const leaveTypeIdx = j;
        await this.leaveMonthlyUsageModel
          .createQueryBuilder()
          .insert()
          .into(LeaveMonthlyUsageEntity)
          .values({ userIdx, year, month, leaveTypeIdx })
          .execute();
      }
    }
  }
}
