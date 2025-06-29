import * as moment from 'moment';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../repository/user.repository';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { AdminUserFilterDto } from '../dto/query.dto';
import { CreateUserDto } from '../dto/createUser.dto';
import { UpdateMyInfoDto } from '../dto/updateMyInfo.dto';
import { UpdatePasswordDto } from '../dto/updateMyPw.dto';
import { decryptPassword, encryptPassword } from '@common/utils/utility';
import { YNEnum } from '@common/constant/enum';
import { UpdateUserDto } from '../dto/updateUser.dto';
import { Transactional } from 'typeorm-transactional';
import { NewAdminInfo } from '../interface/admin.interface';
import { NewUserInfo } from '../interface/user.interface';
import { GlobalUserRepository } from '@global/repository/globalUser.repository';

@Injectable()
export class MockUserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly globalUserRepository: GlobalUserRepository,
  ) {}

  async getAllUserIdxInfo() {
    const result = await this.globalUserRepository.getAllUserIdxInfo();

    return result;
  }

  async getMyInfo(userIdx: number) {
    const userInfo = await this.userRepository.getUserInfo(userIdx);
    if (!userInfo) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return userInfo;
  }

  async getAllGradeIdxInfo() {
    const result = await this.userRepository.getAllGradeIdxInfo();

    return result;
  }

  async getAllUsersInfo(pageNoInfo: PageNoDto, filterInfo: AdminUserFilterDto) {
    const user = await this.userRepository.getAllUsersInfo(pageNoInfo, filterInfo);

    return user;
  }

  @Transactional()
  async createUser(userInfo: CreateUserDto): Promise<void> {
    const result: number = await this.userRepository.getLoginIdCount(userInfo.id);
    if (result >= 1) {
      throw new ConflictException('이미 가입된 유저입니다.(아이디 중복)');
    }

    const { adminGradeIdx, ...rest } = userInfo;
    const newUserInfo: NewUserInfo = rest;
    const newPassword: string = encryptPassword(newUserInfo.id + '2467');

    /* 유저 등록 */
    const userIdx: number = await this.userRepository.createUser(newUserInfo, newPassword);

    /* 어드민 여부 = Y일 경우, 어드민 등록 */
    if (userInfo.adminRole === YNEnum.YES) {
      if (!adminGradeIdx) {
        throw new BadRequestException('어드민 등급을 선택해주세요');
      }
      const newAdminInfo: NewAdminInfo = {
        id: userInfo.id,
        adminName: userInfo.userName,
        adminEmail: userInfo.userEmail,
        adminGradeIdx,
      };

      await this.userRepository.createAdmin(userIdx, newAdminInfo);
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

  @Transactional()
  async updateMyInfo(userIdx: number, updateInfo: UpdateMyInfoDto): Promise<void> {
    const userCnt: number = await this.globalUserRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    await this.userRepository.updateMyInfo(userIdx, updateInfo);

    return;
  }

  @Transactional()
  async updateMyPassword(userIdx: number, updateInfo: UpdatePasswordDto): Promise<void> {
    const userCnt: number = await this.globalUserRepository.getUserCountByIdx(userIdx);
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
    /* 새 비밀번호 암호화 및 저장 */
    const encryptedNewPW: string = encryptPassword(updateInfo.newPassword);
    await this.userRepository.updateUserPassword(userIdx, encryptedNewPW);

    return;
  }

  async getAllHqIdxInfo() {
    const result = await this.userRepository.getAllHqIdxInfo();

    return result;
  }

  async getAllTeamIdxInfo() {
    const result = await this.userRepository.getAllTeamIdxInfo();

    return result;
  }

  @Transactional()
  async updateUser(userIdx: number, updateInfo: UpdateUserDto): Promise<void> {
    const result: any = await this.userRepository.getUserInfoByIdx(userIdx);
    if (!result) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    /* 유저 정보 수정 */
    const { adminGradeIdx, ...rest } = updateInfo;
    const updateUserInfo: NewUserInfo = rest;
    await this.userRepository.updateUserInfo(userIdx, updateUserInfo);

    if (updateInfo.adminRole === YNEnum.NO && updateInfo.adminGradeIdx) {
      throw new BadRequestException('어드민이 아닌 유저는 어드민 등급을 설정할 수 없습니다.');
    }
    if (updateInfo.adminRole === YNEnum.YES && !updateInfo.adminGradeIdx) {
      throw new BadRequestException('어드민인 유저는 어드민 등급을 설정해야합니다.');
    }

    /* 어드민 정보 수정 */
    // 어드민 N → Y인 경우,
    if (result.adminRole === YNEnum.NO && updateInfo.adminRole === YNEnum.YES) {
      const newAdminInfo: NewAdminInfo = {
        id: updateInfo.id,
        adminName: updateInfo.userName,
        adminEmail: updateInfo.userEmail,
        adminGradeIdx,
      };
      await this.userRepository.createAdmin(userIdx, newAdminInfo);
    }
    // 어드민 Y → N인 경우,
    if (result.adminRole === YNEnum.YES && updateInfo.adminRole === YNEnum.NO) {
      await this.userRepository.deleteAdmin(userIdx);
    }
  }

  @Transactional()
  async deleteUser(userIdx: number): Promise<void> {
    const result = await this.userRepository.getUserInfoByIdx(userIdx);
    if (!result) {
      throw new BadRequestException('이미 비활성된 유저이거나 올바른 유저가 아닙니다.');
    }
    // 유저 비활성화
    await this.userRepository.deleteUser(userIdx);
    // 어드민 비활성화
    if (result.adminRole === YNEnum.YES) {
      await this.userRepository.deleteAdmin(userIdx);
    }

    return;
  }

  async getBirthdayUsers(date: string) {
    const result = await this.userRepository.getBirthdayUsersByDate(date);

    return result;
  }
}
