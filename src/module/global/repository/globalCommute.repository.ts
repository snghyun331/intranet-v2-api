import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { InsertResult, Repository } from 'typeorm';
import { LeaveTypeEntity } from '@/entity/intranet/leave/leaveType.entity';
import { ConfirmEnum } from '@common/constant/enum';

@Injectable()
export class GlobalCommuteRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async createTodayCommute(userIdx: number, commuteDate: string): Promise<InsertResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, commuteDate })
      .execute();
  }

  async getUserCommuteInfo(userIdx: number, commuteDate: string) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.availCheckOutTime AS availCheckOutTime',
      ])
      .leftJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .andWhere('commuteEntity.confirmYN != :confirmYN', { confirmYN: ConfirmEnum.REJECT })
      .getRawMany();

    return result;
  }
}
