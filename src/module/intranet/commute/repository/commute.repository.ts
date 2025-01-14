import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, InsertResult, Repository, UpdateResult } from 'typeorm';
import { CheckInDto } from '../dto/checkIn.dto';
import { IntranetAttendanceEnum } from '../../../../common/constant/enum';
import { CheckOutDto } from '../dto/checkOut.dto';

@Injectable()
export class CommuteRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async checkInWork(userIdx: number, checkInDto: CheckInDto, manager: EntityManager): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, attendance: IntranetAttendanceEnum.NORMAL, ...checkInDto })
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

  async getTodayCommuteInfo(userIdx: number, commuteDate: string): Promise<{ checkInTime: Date }> {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.checkInTime AS checkInTime'])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    return result;
  }

  async checkOutWork(
    userIdx: number,
    { commuteDate, checkOutDeviceType, checkOutTime, earlyLeaveReason }: CheckOutDto,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ checkOutDeviceType, checkOutTime, earlyLeaveReason })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('commuteDate = :commuteDate', { commuteDate })
      .execute();
  }
}
