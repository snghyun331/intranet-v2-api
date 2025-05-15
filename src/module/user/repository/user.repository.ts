import { Injectable } from '@nestjs/common';
import { UserEntity } from '@entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { HeadquarterEntity } from '@entity/user/headquarter.entity';
import { TeamEntity } from '@entity/user/team.entity';
import { GradeEntity } from '@entity/user/grade.entity';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { AdminUserFilterDto } from '@user/dto/query.dto';
import { calculateAvailCheckOutTime, encryptPassword, removeAllWhiteSpace } from '@common/utils/utility';
import { CreateUserDto } from '@user/dto/createUser.dto';
import { UpdateMyInfoDto } from '@user/dto/updateMyInfo.dto';
import { AdminEntity } from '@entity/admin/admin.entity';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { NewAdminInfo } from '@user/interface/admin.interface';
import { NewUserInfo } from '@user/interface/user.interface';
import { YNALLEnum, YNEnum } from '@common/constant/enum';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { UpdateCommentDto } from '@user/dto/updateComment.dto';
import { NewMealStats } from '../../scheduler/interface/mealStats.interface';
import { MealStatsEntity } from '../../../entity/meal/mealStats.entity';
import { NewWelfareMonthStats, NewWelfareStats } from '../../welfare/interface';
import { WelfareStatsEntity } from '../../../entity/welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '../../../entity/welfare/welfareMonthlyStats.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(GradeEntity) private readonly gradeModel: Repository<GradeEntity>,
    @InjectRepository(HeadquarterEntity) private readonly hqModel: Repository<HeadquarterEntity>,
    @InjectRepository(TeamEntity) private readonly teamModel: Repository<TeamEntity>,
    @InjectRepository(AdminEntity) private readonly adminModel: Repository<AdminEntity>,
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<AdminEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
    @InjectRepository(LeaveUsageEntity) private readonly leaveUsageModel: Repository<LeaveUsageEntity>,
    @InjectRepository(LeaveMonthlyUsageEntity)
    private readonly leaveMonthlyUsageModel: Repository<LeaveMonthlyUsageEntity>,
    @InjectRepository(MealStatsEntity) private readonly mealStatsModel: Repository<MealStatsEntity>,
    @InjectRepository(WelfareStatsEntity) private readonly welfareStatsModel: Repository<WelfareStatsEntity>,
    @InjectRepository(WelfareMonthlyStatsEntity)
    private readonly welfareMonthStatsModel: Repository<WelfareMonthlyStatsEntity>,
  ) {}

  async getLoginIdCount(loginId: string): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.id = :id', { id: loginId })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getCount();

    return userCnt;
  }

  async getLoginIdCountExceptMe(loginId: string, userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.id = :id', { id: loginId })
      .andWhere('userEntity.userIdx != :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getCount();

    return userCnt;
  }

  async getAllUserIdxInfo() {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.gradeIdx AS gradeIdx'])
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    return result;
  }

  async getUserInfo(userIdx: number, commuteDate: string) {
    const queryResult = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.userGender AS userGender',
        'userEntity.userCell AS userCell',
        'userEntity.userEmail AS userEmail',
        'userEntity.userBirth AS userBirth',
        'userEntity.userAddress AS userAddress',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'userEntity.adminRole AS adminRole',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    const commuteInfo = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'commuteEntity.confirmYN AS confirmYN',
      ])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    const checkInTime = commuteInfo?.checkInTime ?? null;
    const leaveTypeIdx = commuteInfo?.leaveTypeIdx ?? null;
    const confirmYN = commuteInfo?.confirmYN ?? null;
    const availCheckOutTime = checkInTime ? calculateAvailCheckOutTime(checkInTime, leaveTypeIdx, confirmYN) : null;
    const result = {
      ...queryResult,
      checkInTime,
      availCheckOutTime,
      attendance: commuteInfo?.attendance ?? null,
      workingMinutes: commuteInfo?.workingMinutes ?? null,
      leaveTypeIdx: commuteInfo?.leaveTypeIdx ?? null,
    };

    return result;
  }

  async getAllGradeIdxInfo() {
    const result = await this.gradeModel
      .createQueryBuilder('gradeEntity')
      .select(['gradeEntity.gradeIdx AS gradeIdx', 'gradeEntity.gradeName AS gradeName'])
      .getRawMany();

    return result;
  }

  async getAllUsersInfo({ perPage, pageNo }: PageNoDto, filterInfo: AdminUserFilterDto) {
    const query: SelectQueryBuilder<UserEntity> = this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.id AS id',
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.userGender AS userGender',
        'userEntity.userCell AS userCell',
        'userEntity.userAddress AS userAddress',
        'userEntity.userEmail AS userEmail',
        'userEntity.userBirth AS userBirth',
        'userEntity.joinDate AS joinDate',
        'userEntity.hqIdx AS hqIdx',
        'userEntity.teamIdx AS teamIdx',
        'userEntity.gradeIdx AS gradeIdx',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'userEntity.adminRole AS adminRole',
        'adminEntity.adminGradeIdx AS adminGradeIdx',
        'userEntity.comment AS comment',
        'userEntity.userPersonalEmail AS userPersonalEmail',
        'userEntity.accountNumber AS accountNumber',
        'userEntity.accountBank AS accountBank',
        'userEntity.passportName AS passportName',
        'userEntity.passportBirth AS passportBirth',
        'userEntity.passportNo AS passportNo',
        'userEntity.passportExpiry AS passportExpiry',
        'userEntity.probationPeriod AS probationPeriod',
        'userEntity.userAvail AS userAvail',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .innerJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(AdminEntity, 'adminEntity', 'adminEntity.userIdx = userEntity.userIdx');

    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }
    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }
    if (filterInfo.userAvail === YNALLEnum.YES) {
      query.andWhere('userEntity.userAvail = :userAvail', { userAvail: YNALLEnum.YES });
    }
    if (filterInfo.userAvail === YNALLEnum.NO) {
      query.andWhere('userEntity.userAvail = :userAvail', { userAvail: YNALLEnum.NO });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('userEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    return { totalPage, total, users: result };
  }

  async createUser(newUserInfo: CreateUserDto): Promise<number> {
    const password: string = encryptPassword(newUserInfo.id + '2467');

    const result: InsertResult = await this.userModel
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({ password, ...newUserInfo })
      .execute();

    return result.identifiers[0].userIdx;
  }

  async updateMyInfo(userIdx: number, updateInfo: UpdateMyInfoDto): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getUserPassword(userIdx: number): Promise<string> {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.password AS password'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    const { password } = result;

    return password;
  }

  async updateUserPassword(userIdx: number, password: string): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set({ password })
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getAllHqIdxInfo() {
    const result = await this.hqModel
      .createQueryBuilder('hqEntity')
      .select(['hqEntity.hqIdx AS hqIdx', 'hqEntity.hqName AS hqName'])
      .getRawMany();

    return result;
  }

  async getAllTeamIdxInfo() {
    const result = await this.teamModel
      .createQueryBuilder('teamEntity')
      .select(['teamEntity.teamIdx AS teamIdx', 'teamEntity.teamName AS teamName'])
      .getRawMany();

    return result;
  }

  async createAdmin(userIdx: number, adminInfo: NewAdminInfo): Promise<InsertResult> {
    const password: string = encryptPassword(adminInfo.id + '2467');

    return await this.adminModel
      .createQueryBuilder()
      .insert()
      .into(AdminEntity)
      .values({ userIdx, password, ...adminInfo })
      .execute();
  }

  async updateAdmin(userIdx: number, adminInfo: NewAdminInfo): Promise<UpdateResult> {
    const password: string = encryptPassword(adminInfo.id + '2467');

    return await this.adminModel
      .createQueryBuilder()
      .update(AdminEntity)
      .set({ password, ...adminInfo })
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async updateUserInfo(userIdx: number, updateInfo: NewUserInfo): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getAdminInfoByUserIdx(userIdx: number) {
    const result = await this.adminModel
      .createQueryBuilder('adminEntity')
      .select(['adminEntity.adminIdx AS adminIdx'])
      .where('adminEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async deleteUser(userIdx: number): Promise<DeleteResult> {
    return await this.userModel
      .createQueryBuilder()
      .delete()
      .from(UserEntity)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getUserInfoByIdx(userIdx: number) {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName', 'userEntity.adminRole AS adminRole'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async deleteAdmin(userIdx: number): Promise<DeleteResult> {
    return await this.adminModel
      .createQueryBuilder()
      .delete()
      .from(AdminEntity)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getBirthdayUsersByDate(month: string) {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'gradeEntity.gradeName AS gradeName',
        'userEntity.userBirth AS userBirth',
      ])
      .innerJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('month(userEntity.userBirth) = :month', { month })
      .orderBy('userEntity.userBirth', 'ASC')

      .getRawMany();

    return result;
  }

  async updateUserStatus(userIdx: number, userAvail: YNEnum): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set({ userAvail })
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async createLeaveStatsInfo(userIdx: number, year: string): Promise<InsertResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .insert()
      .into(LeaveStatsEntity)
      .values({ userIdx, year })
      .execute();
  }

  async createLeaveUsageInfo(userIdx: number, year: string): Promise<void> {
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

  async createLeaveMonthlyUsageInfo(userIdx: number, year: string): Promise<void> {
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

  async updateComment(userIdx: number, commentInfo: UpdateCommentDto): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set(commentInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async createMealStats(newMealStats: NewMealStats): Promise<InsertResult> {
    return await this.mealStatsModel.createQueryBuilder().insert().into(MealStatsEntity).values(newMealStats).execute();
  }

  async getAnotherUserMealStats(year: string, month: string) {
    const result = await this.mealStatsModel
      .createQueryBuilder('mealStatsEntity')
      .select(['mealStatsEntity.holidays AS holidays', 'mealStatsEntity.workdays AS workdays'])
      .where('mealStatsEntity.year = :year', { year })
      .andWhere('mealStatsEntity.month = :month', { month })
      .getRawOne();

    return result;
  }

  async createWelfareStats(newStatsInfo: NewWelfareStats): Promise<InsertResult> {
    return await this.welfareStatsModel
      .createQueryBuilder()
      .insert()
      .into(WelfareStatsEntity)
      .values({ ...newStatsInfo })
      .execute();
  }

  async createWelfareMonthStats(newMonthStatsInfo: NewWelfareMonthStats): Promise<InsertResult> {
    return await this.welfareMonthStatsModel
      .createQueryBuilder()
      .insert()
      .into(WelfareMonthlyStatsEntity)
      .values({ ...newMonthStatsInfo })
      .execute();
  }

  async updateMealBudget(userIdx: number, year: string, month: string) {
    const query = `
        (workdays + holiday_workdays - time_off_days) * 
        (SELECT base_amount FROM meal_base WHERE meal_base.year = :year AND meal_base.month = :month)
    `;

    return await this.mealStatsModel
      .createQueryBuilder()
      .update(MealStatsEntity)
      .set({ mealBudget: () => query })
      .where('year = :year', { year })
      .andWhere('month = :month', { month })
      .andWhere('userIdx = :userIdx', { userIdx })
      .execute();
  }
}
