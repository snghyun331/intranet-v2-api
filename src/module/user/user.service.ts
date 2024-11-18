import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
} from './interface/result.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from './dto/query.dto';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateMyInfoDto } from './dto/updateMyInfo.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUserIdxInfo(): Promise<UserIdxsResult[]> {
    const result: UserIdxsResult[] = await this.userRepository.getAllUserIdxInfo();

    return result;
  }

  async getMyInfo(userIdx: number): Promise<CurrentUserInfoResult> {
    const user: CurrentUserInfoResult = await this.userRepository.getUserInfo(userIdx);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
  }

  async getAllGradeIdxInfo(): Promise<GradeIdxsResult[]> {
    const result: GradeIdxsResult[] = await this.userRepository.getAllGradeIdxInfo();

    return result;
  }

  async getAllUsersInfo(pageNoInfo: PageNoDto, filterInfo: AdminUserFilterDto): Promise<AllUserInfoResult> {
    if ((filterInfo.sortby && !filterInfo.orderby) || (!filterInfo.sortby && filterInfo.orderby)) {
      throw new BadRequestException('sortby와 orderby는 함께 제공되거나 둘 다 없어야 합니다.');
    }
    if ((filterInfo.joinSDate && !filterInfo.joinEDate) || (!filterInfo.joinSDate && filterInfo.joinEDate)) {
      throw new BadRequestException('joinSDate와 joinEDate는 함께 제공되거나 둘 다 없어야 합니다.');
    }
    if (filterInfo.joinSDate > filterInfo.joinEDate) {
      throw new BadRequestException('joinSDate는 joinEDate보다 클 수 없습니다.');
    }

    const user: AllUserInfoResult = await this.userRepository.getAllUsersInfo(pageNoInfo, filterInfo);

    return user;
  }

  async createUser(newUserInfo: CreateUserDto, manager: EntityManager): Promise<void> {
    await this.userRepository.createUser(newUserInfo, manager);

    return;
  }

  async checkIdIfAvailable(loginId: string): Promise<string> {
    const result: number = await this.userRepository.getLoginIdCount(loginId);
    if (result >= 1) {
      throw new ConflictException('중복된 ID입니다. 다른 ID를 입력해 주세요.');
    }

    return loginId;
  }

  async updateMyInfo(userIdx: number, updateInfo: UpdateMyInfoDto, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    await this.userRepository.updateUserInfo(userIdx, updateInfo, manager);

    return;
  }
}
