import { Injectable } from '@nestjs/common';
import { UserRepository } from './repository/user.repository';
import { GetUserIdxDto } from './dto/getUserIdx.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getAllUserIdxInfo(): Promise<GetUserIdxDto[]> {
    const result: GetUserIdxDto[] = await this.userRepository.getAllUserIdxInfo();

    return result;
  }
}
