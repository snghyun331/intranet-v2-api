import { Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entity/user/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GetUserIdxDto } from '../dto/getUserIdx.dto';

@Injectable()
export class UserRepository {
  constructor(@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>) {}

  async getAllUserIdxInfo(): Promise<GetUserIdxDto[]> {
    const result: GetUserIdxDto[] = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx', 'userEntity.userName AS userName'])
      .getRawMany();

    return result;
  }
}
