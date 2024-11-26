import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
  HqIdxsResult,
  TeamIdxsResult,
} from './interface/result.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from './dto/query.dto';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateMyInfoDto } from './dto/updateMyInfo.dto';
import { UpdateMyPwDto } from './dto/updateMyPw.dto';
import { decryptPassword, encryptPassword } from '../../common/utils/utility';
import { YNEnum } from '../../common/constant/enum';
import { UpdateUserDto } from './dto/updateUser.dto';

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

  async createUser(userInfo: CreateUserDto, manager: EntityManager): Promise<void> {
    const { adminGradeIdx, ...newUserInfo } = userInfo;

    /* 유저 등록 */
    const userIdx: number = await this.userRepository.createUser(newUserInfo, manager);

    /* 어드민 여부 = Y일 경우, 어드민 등록 */
    if (userInfo.adminRole === YNEnum.YES) {
      if (!adminGradeIdx) {
        throw new BadRequestException('어드민 등급을 선택해주세요');
      }
      await this.userRepository.createAdmin(userIdx, userInfo, manager);
    }

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

    await this.userRepository.updateMyInfo(userIdx, updateInfo, manager);

    return;
  }

  async updateMyPassword(userIdx: number, updateInfo: UpdateMyPwDto, manager: EntityManager): Promise<void> {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    /* 기존 비밀번호가 맞는지 체크 */
    const encryptedPrePW: string = await this.userRepository.getUserPassword(userIdx);
    const decryptedPrePW: string = decryptPassword(encryptedPrePW);
    if (updateInfo.prePassword !== decryptedPrePW) {
      throw new BadRequestException('기존 비밀번호가 올바르지 않습니다');
    }
    /* 새 비밀번호와 새 비밀번호 확인 비교 */
    if (updateInfo.newPassword !== updateInfo.confirmPassword) {
      throw new BadRequestException('비밀번호가 같지 않습니다');
    }
    /* 새 비밀번호 암호화 및 저장*/
    const encryptedNewPW: string = encryptPassword(updateInfo.newPassword);
    await this.userRepository.updateUserPassword(userIdx, encryptedNewPW, manager);

    return;
  }

  async getAllHqIdxInfo(): Promise<HqIdxsResult[]> {
    const result: HqIdxsResult[] = await this.userRepository.getAllHqIdxInfo();

    return result;
  }

  async getAllTeamIdxInfo(): Promise<TeamIdxsResult[]> {
    const result: TeamIdxsResult[] = await this.userRepository.getAllTeamIdxInfo();

    return result;
  }

  async updateUser(userIdx: number, updateInfo: UpdateUserDto, manager: EntityManager): Promise<void> {
    await this.userRepository.updateUserInfo(userIdx, updateInfo, manager);

    if (updateInfo.adminRole === YNEnum.NO && updateInfo.adminGradeIdx) {
      throw new BadRequestException('어드민이 아닌 유저는 어드민 등급을 설정할 수 없습니다.');
    }
    if (updateInfo.adminRole === YNEnum.YES && !updateInfo.adminGradeIdx) {
      throw new BadRequestException('어드민인 유저는 어드민 등급을 설정해야합니다.');
    }
    if (updateInfo.adminGradeIdx) {
      await this.userRepository.updateAdminInfo(userIdx, updateInfo, manager);
    }
  }
}
