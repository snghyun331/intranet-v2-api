import { Injectable } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { UserIdxsResult } from './interface/result.interface';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUserIdxInfo(): Promise<UserIdxsResult[]> {
    const result: UserIdxsResult[] = await this.userRepository.getAllUserIdxInfo();

    return result;
  }
}
