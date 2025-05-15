import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { Repository } from 'typeorm';
import { UserGradeIdxEnum, YNEnum } from '@common/constant/enum';
import { HeadquarterEntity } from '@entity/user/headquarter.entity';
import { TeamEntity } from '@entity/user/team.entity';
import { GradeEntity } from '@entity/user/grade.entity';
import { AdminEntity } from '../../../entity/admin/admin.entity';

@Injectable()
export class GlobalUserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(AdminEntity) private readonly adminModel: Repository<AdminEntity>,
  ) {}

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getCount();

    return userCnt;
  }

  async getAdminCountByIdx(adminIdx: number): Promise<number> {
    const userCnt: number = await this.adminModel
      .createQueryBuilder('adminEntity')
      .where('adminEntity.adminIdx = :adminIdx', { adminIdx })
      .getCount();

    return userCnt;
  }

  async getAllUserNames(): Promise<string[]> {
    const result: { userName: string }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    const allNames: string[] = result.map((r) => r.userName);

    return allNames;
  }

  async getUserIdxByName(userName: string): Promise<any> {
    const result: any = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.gradeIdx AS gradeIdx', 'userEntity.teamIdx AS teamIdx'])
      .where('userEntity.userName = :userName', { userName })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return result;
  }

  async getManagerOrHigherUserIdxList(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.gradeIdx <= :gradeIdx', { gradeIdx: UserGradeIdxEnum.MANAGER })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async getAllUserIdxExceptCEO(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.gradeIdx != :gradeIdx', { gradeIdx: UserGradeIdxEnum.CEO })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }

  async getUserNameByIdx(userIdx: number): Promise<{ userName: string }> {
    const result: { userName: string } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return result;
  }

  async getUserInfoByIdx(userIdx: number) {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return result;
  }

  async isBirthday(userIdx: number, commuteDate: string): Promise<boolean> {
    const date: string = commuteDate.slice(5);
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('DATE_FORMAT(userEntity.userBirth, "%m-%d") = :date', { date })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return !!result;
  }

  async getManagerLevelUserIdxs(): Promise<number[]> {
    const result: { userIdx: number }[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.gradeIdx <= :gradeIdx', { gradeIdx: UserGradeIdxEnum.MANAGER })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    const userIdxList: number[] = result.map((r) => r.userIdx);

    return userIdxList;
  }
}
