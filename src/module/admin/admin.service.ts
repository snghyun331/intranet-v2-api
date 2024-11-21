import { Injectable } from '@nestjs/common';
import { AdminRespository } from './repository/admin.repository';
import { AdminGradeIdxsResult } from './interface/result.interface';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRespository) {}

  async getAllAdminGradeIdxInfo(): Promise<AdminGradeIdxsResult[]> {
    const result: AdminGradeIdxsResult[] = await this.adminRepository.getAllAdminGradeIdxInfo();

    return result;
  }
}
