import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { CurrentUserInfoResult, UserIdxsResult } from './interface/result.interface';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUserIdxInfo(): Promise<UserIdxsResult[]> {
    const result: UserIdxsResult[] = await this.userRepository.getAllUserIdxInfo();

    return result;
  }

  async getUserInfo(userIdx: number): Promise<CurrentUserInfoResult> {
    const user: CurrentUserInfoResult = await this.userRepository.getUserInfo(userIdx);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다.');
    }

    return user;
  }
}
