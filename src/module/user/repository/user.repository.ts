import { BadRequestException, Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
} from '../interface/result.interface';
import { EntityManager, InsertResult, Repository, SelectQueryBuilder } from 'typeorm';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AllUserInfo } from '../interface/user.interface';
import { AdminUserFilterDto } from '../dto/query.dto';
import { removeAllWhiteSpace } from '../../../common/utils/utility';
import { CreateUserDto } from '../dto/createUser.dto';
import { SortbyEnum } from '../../../common/constant/enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(GradeEntity) private readonly gradeModel: Repository<GradeEntity>,
  ) {}

  async getLoginIdCnt(loginId: string): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.id = :id', { id: loginId })
      .getCount();

    return userCnt;
  }

  async getAllUserIdxInfo(): Promise<UserIdxsResult[]> {
    const result: UserIdxsResult[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName'])
      .where('userEntity.userAvail IS NULL')
      .getRawMany();

    return result;
  }

  async getUserInfo(userIdx: number): Promise<CurrentUserInfoResult> {
    const result: CurrentUserInfoResult = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.userGender AS userGender',
        'userEntity.userCell AS userCell',
        'userEntity.userEmail AS userEmail',
        'userEntity.userBirth AS userBirth',
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
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.userGender AS userGender',
        'userEntity.userCell AS userCell',
        'userEntity.userAddress AS userAddress',
        'userEntity.userEmail AS userEmail',
        'userEntity.userBirth AS userBirth',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'userEntity.adminRole AS adminRole',
        'userEntity.comment AS comment',
        'userEntity.userAvail AS userAvail',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx');

    if (filterInfo.gradeIdx) {
      query.andWhere('userEntity.gradeIdx = :gradeIdx', { gradeIdx: filterInfo.gradeIdx });
    }

    if (filterInfo.joinDate) {
      query.andWhere('userEntity.joinDate = :joinDate', { joinDate: filterInfo.joinDate });
    }
    if (filterInfo.userGender) {
      query.andWhere('userEntity.userGender = :userGender', { userGender: filterInfo.userGender });
    }
    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }

    const total = await query.getCount();
    const totalPage = Math.ceil(total / perPage);

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

  async createUser(newUserInfo: CreateUserDto, manager: EntityManager): Promise<InsertResult> {
    const password: string = newUserInfo.id + '2467';

    return await manager
      .createQueryBuilder()
      .insert()
      .into(UserEntity)
      .values({ password, ...newUserInfo })
      .execute();
  }
}
