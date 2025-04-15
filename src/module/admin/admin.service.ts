import { Injectable } from '@nestjs/common';
import { AdminRespository } from './repository/admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRespository) {}

  async getAllAdminGradeIdxInfo() {
    const result = await this.adminRepository.getAllAdminGradeIdxInfo();

    return result;
  }
}
