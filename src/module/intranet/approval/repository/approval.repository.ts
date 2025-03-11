import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, Repository, UpdateResult } from 'typeorm';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';
import { ConfirmEnum } from '../../../../common/constant/enum';
import moment from 'moment';
import { getStartAndEndDateByMonth } from '../../../../common/utils/utility';

@Injectable()
export class ApprovalRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async getCommuteCountByIdx(commuteIdx: number): Promise<number> {
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEntity.commuteIdx', { commuteIdx })
      .getCount();

    return result;
  }

  async getCommuteInfoWithApprover(commuteIdx: number) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteApproverEntity.userIdx AS approverIdx',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .leftJoin(
        CommuteApproverEntity,
        'commuteApproverEntity',
        'commuteApproverEntity.commuteIdx = commuteEntity.commuteIdx',
      )
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawMany();

    return result;
  }

  async updateConfirm(
    commuteIdx: number,
    userIdx: number,
    confirmYN: ConfirmEnum,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    const confirmYNDateInfo = { confirmDate: null, rejectDate: null };
    switch (confirmYN) {
      case ConfirmEnum.YES:
        confirmYNDateInfo.confirmDate = moment().utcOffset(9).format('YYYY-MM-DD');
        break;
      case ConfirmEnum.REJECT:
        confirmYNDateInfo.rejectDate = moment().utcOffset(9).format('YYYY-MM-DD');
        break;
      default:
        break;
    }

    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ confirmYN, confirmPersonIdx: userIdx, ...confirmYNDateInfo })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async getTotalLeaveCountForMonth(
    year: string,
    month: string,
    userIdx: number,
    leaveTypeIdx: number,
  ): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(Number(year), Number(month));
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEnti()ty.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getCount();

    return result;
  }
}
