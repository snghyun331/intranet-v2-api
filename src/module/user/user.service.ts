import * as moment from 'moment';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from './dto/query.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateMyInfoDto } from './dto/updateMyInfo.dto';
import { UpdatePasswordDto } from './dto/updateMyPw.dto';
import { decryptPassword, encryptPassword } from '../../common/utils/utility';
import { YNEnum } from '../../common/constant/enum';
import { UpdateUserDto } from './dto/updateUser.dto';
import { RedisSearchService } from '../redis/redisSearch.service';
import { Transactional } from 'typeorm-transactional';
import { NewAdminInfo } from './interface/admin.interface';
import { NewUserInfo } from './interface/user.interface';
import { CommuteRepository } from '../intranet/commute/repository/commute.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly commuteRepository: CommuteRepository,
    private readonly redisSearchService: RedisSearchService,
  ) {}

  async getAllUserIdxInfo() {
    const result = await this.userRepository.getAllUserIdxInfo();

    return result;
  }

  async getMyInfo(userIdx: number) {
    const commuteDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    const user = await this.userRepository.getUserInfo(userIdx, commuteDate);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
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
    const currentYear: string = moment().utcOffset(9).year().toString();
    const result: number = await this.userRepository.getLoginIdCount(userInfo.id);
    if (result >= 1) {
      throw new ConflictException('이미 가입된 유저입니다.(아이디 중복)');
    }

    const { adminGradeIdx, ...rest } = userInfo;
    const newUserInfo: NewUserInfo = rest;

    /* 유저 등록 */
    const userIdx: number = await this.userRepository.createUser(newUserInfo);

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

    /*  leaveStats 엔티티에 데이터(default: 0) 추가 */
    await this.userRepository.createLeaveStatsInfo(userIdx, currentYear);

    /* leaveUsage 엔티티에 데이터(default: 0) 추가 */
    await this.userRepository.createLeaveUsageInfo(userIdx, currentYear);

    /* leaveMonthlyUsage 엔티티에 데이터(default: 0) 추가 */
    await this.userRepository.createLeaveMonthlyUsageInfo(userIdx, currentYear);

    /* 등록일 기준 출퇴근 데이터 생성 */
    const commuteDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    await this.commuteRepository.createTodayCommute(userIdx, commuteDate);

    /* Redis에 유저 등록(검색 자동완성) */
    await this.redisSearchService.addUserInRedis(userIdx, userInfo.userName);

    return;
  }

  async checkIdIfAvailable(loginId: string, userIdx: number): Promise<string> {
    const result: number = await this.userRepository.getLoginIdCountExceptMe(loginId, userIdx);
    if (result >= 1) {
      throw new ConflictException('중복된 ID입니다. 다른 ID를 입력해 주세요.');
    }

    return loginId;
  }

  @Transactional()
  async updateMyInfo(userIdx: number, updateInfo: UpdateMyInfoDto): Promise<void> {
    const userCnt: number = await this.userRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    await this.userRepository.updateMyInfo(userIdx, updateInfo);

    return;
  }

  @Transactional()
  async updateMyPassword(userIdx: number, updateInfo: UpdatePasswordDto): Promise<void> {
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
    if (updateInfo.adminRole === YNEnum.YES) {
      const newAdminInfo: NewAdminInfo = {
        id: updateInfo.id,
        adminName: updateInfo.userName,
        adminEmail: updateInfo.userEmail,
        adminGradeIdx,
      };
      const previousAdminInfo = await this.userRepository.getAdminInfoByUserIdx(userIdx);
      // 활성 상태인 어드민일 경우
      if (previousAdminInfo && previousAdminInfo.adminAvail === null) {
        await this.userRepository.updateAdminInfo(previousAdminInfo.adminIdx, newAdminInfo);
      } else if (previousAdminInfo && previousAdminInfo.adminAvail !== null) {
        // 비활성 상태인 어드민일 경우
        await this.userRepository.restoreUpdateAdmin(previousAdminInfo.adminIdx, newAdminInfo);
      } else {
        // 어드민이 처음일 경우
        await this.userRepository.createAdmin(userIdx, newAdminInfo);
      }
    } else {
      const previousAdminInfo = await this.userRepository.getAdminInfoByUserIdx(userIdx);
      // 어드민 O → 어드민 X로 변경할 경우
      if (previousAdminInfo && previousAdminInfo.adminAvail === null) {
        await this.userRepository.deleteAdmin(userIdx);
      }
    }

    /* 유저네임이 바뀌었다면, Redis 유저네임 업데이트 */
    if (updateInfo.userName !== result.userName) {
      await this.redisSearchService.removeUserInRedis(userIdx, result.userName);
      await this.redisSearchService.addUserInRedis(userIdx, updateInfo.userName);
    }
  }

  async getBirthdayUsers(date: string) {
    const result = await this.userRepository.getBirthdayUsersByDate(date);

    return result;
  }

  async getAllUserName(searchWord: string) {
    const result = await this.redisSearchService.getUserNameByPrefix(searchWord);

    return result;
  }

  async addUserInRedis({ userIdx, userName }) {
    await this.redisSearchService.addUserInRedis(userIdx, userName);

    return;
  }

  @Transactional()
  async updateUserStatus(userIdx: number, userAvail: YNEnum) {
    const result = await this.userRepository.getUsersIncludeInactiveByIdx(userIdx);
    if (!result) {
      throw new BadRequestException('직원 정보가 없습니다.');
    }

    /* 비활성화 유저를 활성화 */
    if (userAvail === YNEnum.YES) {
      // userAvail를 null로 변경
      await this.userRepository.restoreUser(userIdx);

      // 등록일 기준 출퇴근 정보 생성
      const commuteDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
      await this.commuteRepository.createTodayCommute(userIdx, commuteDate);

      // Redis에 유저 등록(검색 자동완성)
      await this.redisSearchService.addUserInRedis(userIdx, result.userName);
    } else {
      // 활성화 유저를 비활성화
      await this.userRepository.deleteUser(userIdx);
      if (result.adminRole === YNEnum.YES) {
        await this.userRepository.deleteAdmin(userIdx);
      }

      // Redis에 등록된 유저네임 삭제
      await this.redisSearchService.removeUserInRedis(userIdx, result.userName);
    }
  }
}
