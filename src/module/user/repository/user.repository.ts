import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from '../dto/query.dto';
import { encryptPassword, removeAllWhiteSpace } from '../../../common/utils/utility';
import { CreateUserDto } from '../dto/createUser.dto';
import { UpdateMyInfoDto } from '../dto/updateMyInfo.dto';
import { AdminEntity } from '../../../entity/admin/admin.entity';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';
import { NewAdminInfo } from '../interface/admin.interface';
import { NewUserInfo } from '../interface/user.interface';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(GradeEntity) private readonly gradeModel: Repository<GradeEntity>,
    @InjectRepository(HeadquarterEntity) private readonly hqModel: Repository<HeadquarterEntity>,
    @InjectRepository(TeamEntity) private readonly teamModel: Repository<TeamEntity>,
    @InjectRepository(AdminEntity) private readonly adminModel: Repository<AdminEntity>,
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<AdminEntity>,
  ) {}

  async getLoginIdCount(loginId: string): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.id = :id', { id: loginId })
      .getCount();

    return userCnt;
  }

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getAllUserIdxInfo() {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.gradeIdx AS gradeIdx'])
      .where('userEntity.userAvail IS NULL')
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
      .andWhere('userEntity.userAvail IS NULL')
      .getRawOne();

    const commuteInfo = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    const result = {
      ...queryResult,
      checkInTime: commuteInfo?.checkInTime ?? null,
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
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(AdminEntity, 'adminEntity', 'adminEntity.userIdx = userEntity.userIdx')
      .where('userEntity.userAvail IS NULL');

    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }
    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
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
      .andWhere('userEntity.userAvail IS NULL')
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

  async updateUserInfo(userIdx: number, updateInfo: NewUserInfo): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async updateAdmin(adminIdx: number, updateInfo: NewAdminInfo): Promise<UpdateResult> {
    return await this.adminModel
      .createQueryBuilder()
      .update(AdminEntity)
      .set(updateInfo)
      .where('adminIdx = :adminIdx', { adminIdx })
      .execute();
  }

  async getAdminInfoByUserIdx(userIdx: number) {
    const result = await this.adminModel
      .createQueryBuilder('adminEntity')
      .withDeleted()
      .select(['adminEntity.adminIdx AS adminIdx', 'adminEntity.adminAvail AS adminAvail'])
      .where('adminEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async deleteUser(userIdx: number): Promise<DeleteResult> {
    return await this.userModel
      .createQueryBuilder()
      .softDelete()
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
      .softDelete()
      .from(AdminEntity)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async restoreUpdateAdmin(adminIdx: number, updateInfo: NewAdminInfo): Promise<UpdateResult> {
    return await this.adminModel
      .createQueryBuilder()
      .update(AdminEntity)
      .set({
        adminAvail: null,
        ...updateInfo,
      })
      .where('adminIdx = adminIdx', { adminIdx })
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
      .andWhere('userEntity.userAvail IS NULL')
      .orderBy('userEntity.userBirth', 'ASC')

      .getRawMany();

    return result;
  }
}
