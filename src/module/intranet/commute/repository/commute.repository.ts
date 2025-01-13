import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { StartWorkDto } from '../dto/startWork.dto';
import { IntranetAttendanceEnum } from '../../../../common/constant/enum';

@Injectable()
export class CommuteRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async createWork(userIdx: number, startWorkInfo: StartWorkDto, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, attendance: IntranetAttendanceEnum.NORMAL, ...startWorkInfo })
      .execute();
  }

  async getTodayCommuteCnt(userIdx: number, commuteDate: string): Promise<number> {
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getCount();

    return result;
  }
}
