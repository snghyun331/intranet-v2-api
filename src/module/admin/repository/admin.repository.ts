import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminGradeEntity } from '@entity/admin/grade.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AdminRespository {
  constructor(@InjectRepository(AdminGradeEntity) private readonly adminGradeModel: Repository<AdminGradeEntity>) {}

  async getAllAdminGradeIdxInfo() {
    const result = await this.adminGradeModel
      .createQueryBuilder('adminGradeEntity')
      .select(['adminGradeEntity.adminGradeIdx AS adminGradeIdx', 'adminGradeEntity.adminGradeName AS adminGradeName'])
      .getRawMany();

    return result;
  }
}
