import { Injectable } from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../../entity/user/user.entity';
import { HeadquarterEntity } from '../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../entity/user/team.entity';
import { GradeEntity } from '../../../entity/user/grade.entity';
import { User } from '../interface/user.interface';
import { AdminEntity } from '../../../entity/admin/admin.entity';
import { AdminGradeEntity } from '../../../entity/admin/grade.entity';
import { Admin } from '../interface/admin.interface';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(AdminEntity) private readonly adminModel: Repository<AdminEntity>,
  ) {}

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
      .andWhere('userEntity.userAvail IS NULL')
      .getRawOne();

    return result;
  }

  async updateUserToken(id: string, loginToken: string): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set({ loginToken })
      .where('id = :id', { id })
      .execute();
  }

  async deleteUserToken(userIdx: number): Promise<UpdateResult> {
    return await this.userModel
      .createQueryBuilder()
      .update(UserEntity)
      .set({ loginToken: null })
      .where('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async getAdminPersonal(id: string): Promise<Admin> {
    const result: Admin = await this.adminModel
      .createQueryBuilder('adminEntity')
      .select([
        'adminEntity.adminIdx AS adminIdx',
        'adminEntity.id AS id',
        'adminEntity.password AS password',
        'adminEntity.adminName AS adminName',
        'adminEntity.adminEmail AS adminEmail',
        'adminGradeEntity.adminGradeName AS adminGradeName',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
      ])
      .innerJoin(AdminGradeEntity, 'adminGradeEntity', 'adminGradeEntity.adminGradeIdx = adminEntity.adminGradeIdx')
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = adminEntity.userIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('adminEntity.id = :id', { id })
      .andWhere('adminEntity.adminAvail IS NULL')
      .getRawOne();

    return result;
  }

  async updateAdminToken(id: string, loginToken: string): Promise<UpdateResult> {
    return await this.adminModel
      .createQueryBuilder()
      .update(AdminEntity)
      .set({ loginToken })
      .where('id = :id', { id })
      .execute();
  }
}
