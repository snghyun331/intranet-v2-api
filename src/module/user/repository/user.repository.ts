import { BadRequestException, Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
  HqIdxsResult,
  TeamIdxsResult,
  CurrentUserInfo,
} from '../interface/result.interface';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AllUserInfo } from '../interface/user.interface';
import { AdminUserFilterDto } from '../dto/query.dto';
import { encryptPassword, removeAllWhiteSpace } from '../../../common/utils/utility';
import { CreateUserDto } from '../dto/createUser.dto';
import { SortbyEnum } from '../../../common/constant/enum';
import { UpdateMyInfoDto } from '../dto/updateMyInfo.dto';
import { AdminEntity } from '../../../entity/admin/admin.entity';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { CommuteEntity } from '../../../entity/intranet/commute/commute.entity';

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

  async getAllUserIdxInfo(): Promise<UserIdxsResult[]> {
    const result: UserIdxsResult[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.gradeIdx AS gradeIdx'])
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    return result;
  }

  async getUserInfo(userIdx: number, commuteDate: string): Promise<CurrentUserInfoResult> {
    const queryResult: CurrentUserInfo = await this.userModel
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
      ])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    const result: CurrentUserInfoResult = {
      ...queryResult,
      checkInTime: commuteInfo?.checkInTime ?? null,
      attendance: commuteInfo?.attendance ?? null,
      workingMinutes: commuteInfo?.workingMinutes ?? null,
    };

    return result;
  }

  async getAllGradeIdxInfo(): Promise<GradeIdxsResult[]> {
    const result: GradeIdxsResult[] = await this.gradeModel
      .createQueryBuilder('gradeEntity')
      .select(['gradeEntity.gradeIdx AS gradeIdx', 'gradeEntity.gradeName AS gradeName'])
      .getRawMany();

    return result;
  }

  async getAllUsersInfo({ perPage, pageNo }: PageNoDto, filterInfo: AdminUserFilterDto): Promise<AllUserInfoResult> {
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
        'userEntity.userAvail AS userAvail',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(AdminEntity, 'adminEntity', 'adminEntity.userIdx = userEntity.userIdx');

    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }
    if (filterInfo.userGender) {
      query.andWhere('userEntity.userGender = :userGender', { userGender: filterInfo.userGender });
    }
    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }
    if (filterInfo.joinSDate && filterInfo.joinEDate) {
      query.andWhere('userEntity.joinDate BETWEEN :joinSDate AND :joinEDate', {
        joinSDate: filterInfo.joinSDate,
        joinEDate: filterInfo.joinEDate,
      });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    if (filterInfo.sortby && filterInfo.orderby) {
      if (filterInfo.sortby === SortbyEnum.GRADE) {
        query
          .orderBy('userEntity.gradeIdx', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.BIRTH) {
        query
          .orderBy('userEntity.userBirth', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.JOIN) {
        query
          .orderBy('userEntity.joinDate', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else if (filterInfo.sortby === SortbyEnum.TEAM) {
        query
          .orderBy('teamEntity.teamName', filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC')
          .addOrderBy('userEntity.joinDate', 'DESC')
          .addOrderBy('userEntity.createdAt', 'DESC')
          .limit(perPage)
          .offset((pageNo - 1) * perPage);
      } else {
        throw new BadRequestException('지원하지 않는 정렬 기준입니다.');
      }
    } else {
      query
        .orderBy('userEntity.joinDate', 'DESC')
        .addOrderBy('userEntity.createdAt', 'DESC')
        .limit(perPage)
        .offset((pageNo - 1) * perPage);
    }

    const result: AllUserInfo[] = await query.getRawMany();

    return { totalPage, total, users: result };
  }

  async createUser(newUserInfo: CreateUserDto, manager: EntityManager): Promise<number> {
    const password: string = encryptPassword(newUserInfo.id + '2467');

    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({ password, ...newUserInfo })
      .execute();

    return result.identifiers[0].userIdx;
  }

  async updateMyInfo(userIdx: number, updateInfo: UpdateMyInfoDto, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(UserEntity)
      .set(updateInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getUserPassword(userIdx: number): Promise<string> {
    const result: { password: string } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.password AS password'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    const { password } = result;

    return password;
  }

  async updateUserPassword(userIdx: number, password: string, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(UserEntity)
      .set({ password })
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getAllHqIdxInfo(): Promise<HqIdxsResult[]> {
    const result: HqIdxsResult[] = await this.hqModel
      .createQueryBuilder('hqEntity')
      .select(['hqEntity.hqIdx AS hqIdx', 'hqEntity.hqName AS hqName'])
      .getRawMany();

    return result;
  }

  async getAllTeamIdxInfo(): Promise<TeamIdxsResult[]> {
    const result: TeamIdxsResult[] = await this.teamModel
      .createQueryBuilder('teamEntity')
      .select(['teamEntity.teamIdx AS teamIdx', 'teamEntity.teamName AS teamName'])
      .getRawMany();

    return result;
  }

  async createAdmin(
    userIdx: number,
    adminInfo: CreateUserDto | UpdateUserDto,
    manager: EntityManager,
  ): Promise<InsertResult> {
    const password: string = encryptPassword(adminInfo.id + '2467');
    const adminName: string = adminInfo.userName;
    const adminEmail: string = adminInfo.userEmail;

    return await manager
      .createQueryBuilder()
      .insert()
      .into(AdminEntity)
      .values({ userIdx, password, adminName, adminEmail, ...adminInfo })
      .execute();
  }

  async updateUserInfo(userIdx: number, updateInfo: UpdateUserDto, manager: EntityManager): Promise<UpdateResult> {
    const { adminGradeIdx, ...userInfo } = updateInfo;

    return await manager
      .createQueryBuilder()
      .update(UserEntity)
      .set(userInfo)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async updateAdmin(adminIdx: number, updateInfo: UpdateUserDto, manager: EntityManager): Promise<UpdateResult> {
    const { id, userName, gradeIdx, hqIdx, teamIdx, userEmail, adminGradeIdx } = updateInfo;

    return await manager
      .createQueryBuilder()
      .update(AdminEntity)
      .set({ id, adminName: userName, gradeIdx, hqIdx, teamIdx, adminEmail: userEmail, adminGradeIdx })
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

  async deleteUser(userIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .softDelete()
      .from(UserEntity)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getUserAdminYN(userIdx: number) {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.adminRole AS adminRole'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async deleteAdmin(userIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .softDelete()
      .from(AdminEntity)
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async restoreUpdateAdmin(adminIdx: number, updateInfo: UpdateUserDto, manager: EntityManager): Promise<UpdateResult> {
    const { id, userName, gradeIdx, hqIdx, teamIdx, userEmail, adminGradeIdx } = updateInfo;

    return await manager
      .createQueryBuilder()
      .update(AdminEntity)
      .set({
        adminAvail: null,
        id,
        adminName: userName,
        gradeIdx,
        hqIdx,
        teamIdx,
        adminEmail: userEmail,
        adminGradeIdx,
      })
      .where('adminIdx = adminIdx', { adminIdx })
      .execute();
  }
}
