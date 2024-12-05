import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PlayGroundRepository {
  constructor(@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>) {}

  async getUserCountByName(userName: string): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userName = :userName', { userName })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }
}
