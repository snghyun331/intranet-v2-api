import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { Repository } from 'typeorm';
import { UserGradeIdxEnum, YNEnum } from '@common/constant/enum';
import { HeadquarterEntity } from '@entity/user/headquarter.entity';
import { TeamEntity } from '@entity/user/team.entity';
import { GradeEntity } from '@entity/user/grade.entity';
import { AdminEntity } from '../../../entity/admin/admin.entity';
import * as moment from 'moment';
import { GlobalHolidayRepository } from './globalHoliday.repository';

@Injectable()
export class GlobalUserRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(AdminEntity) private readonly adminModel: Repository<AdminEntity>,
    private readonly holidayRepository: GlobalHolidayRepository,
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

  async getAllUserIdxInfo() {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName', 'userEntity.gradeIdx AS gradeIdx'])
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawMany();

    return result;
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

  async getUserNameByIdx(userIdx: number): Promise<string> {
    const { userName } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userName AS userName'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return userName;
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
        'userEntity.adminRole AS adminRole',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    return result;
  }

  // 생일인지 판별하는 함수 (생일이 휴일이면 생일 전의 영업일로 간주)
  async isBirthday(userIdx: number, commuteDate: string): Promise<boolean> {
    const { userBirth } = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userBirth AS userBirth'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES })
      .getRawOne();

    const birth = moment(userBirth);
    const commute = moment(commuteDate);
    let birthday = moment(`${commute.year()}-${birth.format('MM-DD')}`);

    while (await this.holidayRepository.isHolidayOrWeekend(birthday.format('YYYY-MM-DD'))) {
      birthday = birthday.subtract(1, 'day');
    }

    return birthday.format('YYYY-MM-DD') === commute.format('YYYY-MM-DD');
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
