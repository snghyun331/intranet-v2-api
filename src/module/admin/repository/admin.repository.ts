import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminGradeEntity } from '../../../entity/admin/grade.entity';
import { Repository } from 'typeorm';
import { AdminGradeIdxsResult } from '../interface/result.interface';

@Injectable()
export class AdminRespository {
  constructor(@InjectRepository(AdminGradeEntity) private readonly adminGradeModel: Repository<AdminGradeEntity>) {}

  async getAllAdminGradeIdxInfo(): Promise<AdminGradeIdxsResult[]> {
    const result: AdminGradeIdxsResult[] = await this.adminGradeModel
      .createQueryBuilder('adminGradeEntity')
      .select(['adminGradeEntity.adminGradeIdx AS adminGradeIdx', 'adminGradeEntity.adminGradeName AS adminGradeName'])
      .getRawMany();

    return result;
  }
}
