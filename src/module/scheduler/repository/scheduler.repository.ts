import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, InsertResult, Repository, UpdateResult } from 'typeorm';
import { HolidayEntity } from '../../../entity/scheduler/holiday.entity';
import { UserEntity } from '../../../entity/user/user.entity';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { HolidayInfo } from '../interface/holiday.interface';
import { LeaveStatsEntity } from '../../../entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '../../../entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveGrantTypeEnum } from '../../../common/constant/enum';

@Injectable()
export class SchedulerRepository {
  constructor(
    @InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(WelfareStatsEntity) private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
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
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    return result;
  }

  async getAllUserWithLessThanOneYear(): Promise<UserEntity[]> {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.joinDate AS joinDate'])
      .where('DATEDIFF(CURDATE(), userEntity.joinDate) <= 365')
      .getRawMany();

    return result;
  }

  async getUserLeaveStatsInfo(userIdx: number, year: string) {
    const statsInfo = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select(
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS lastYearAnnualLeaveBalance',
      )
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    const result = { lastYearAnnualLeaveBalance: Number(statsInfo?.lastYearAnnualLeaveBalance ?? 0) };

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
      WHERE u.user_avail IS NULL
        AND NOT EXISTS (
        SELECT 1 FROM commute c
        WHERE c.user_idx = u.user_idx AND c.commute_date = CURDATE()
      );
    `);

    return;
  }

  async insertLeaveStatsInfo(userIdx: number, year: string, totalReceivedAnnualLeave: number): Promise<InsertResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .insert()
      .into(LeaveStatsEntity)
      .values({ userIdx, year, totalReceivedAnnualLeave })
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

  async insertExtraReceivedAnnualLeave(
    userIdx: number,
    year: string,
    extraAnnualLeaves: number,
    leaveGrantType: LeaveGrantTypeEnum,
  ): Promise<UpdateResult> {
    const updateSet: any = {
      totalReceivedAnnualLeave: () => `totalReceivedAnnualLeave + ${extraAnnualLeaves}`,
    };

    // 입사 1년일 경우, midJoinReceivedAnnualLeave도 같이 등록
    if (leaveGrantType === LeaveGrantTypeEnum.ANNUAL) {
      updateSet.midJoinReceivedAnnualLeave = extraAnnualLeaves;
    }

    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set(updateSet)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('year = :year', { year })
      .execute();
  }
}
