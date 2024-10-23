import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { User } from '../interface/user.interface';

@Injectable()
export class AuthRepository {
  constructor(@InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>) {}

  async getUserPersonal(id: string): Promise<User> {
    const result: User = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.id AS id',
        'userEntity.password AS password',
        'userEntity.userName AS userName',
        'userEntity.userGender AS userGender',
        'userEntity.userBirth AS userBirth',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'userEntity.adminRole AS adminRole',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.id = :id', { id })
      .getRawOne();

    return result;
  }
}
