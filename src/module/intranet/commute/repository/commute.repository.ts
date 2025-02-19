import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { DeleteResult, EntityManager, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { AdminCommuteFilterDto } from '../dto/query.dto';
import { UserEntity } from '../../../../entity/user/user.entity';
import { GradeEntity } from '../../../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../../entity/user/team.entity';
import {
  InsertCheckInInfo,
  UpdateCheckInInfo,
  UpdateCheckOutInfo,
  UpdateCommuteTimeInfo,
} from '../interface/commute.interface';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { IntranetAttendanceEnum } from '../../../../common/constant/enum';
import { LeaveTypeEntity } from '../../../../entity/intranet/leave/leaveType.entity';

@Injectable()
export class CommuteRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async createCheckInWork(
    userIdx: number,
    commuteInfo: InsertCheckInInfo,
    manager: EntityManager,
  ): Promise<InsertResult> {
    return await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, ...commuteInfo, attendance: IntranetAttendanceEnum.CHECK_IN })
      .execute();
  }

  async updateCheckInWork(
    userIdx: number,
    { commuteDate, ...commuteInfo }: UpdateCheckInInfo,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ ...commuteInfo, attendance: IntranetAttendanceEnum.CHECK_IN })
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('commuteDate = :commuteDate', { commuteDate })
      .execute();
  }

  async getCommuteInfoByDate(userIdx: number, commuteDate: string) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    return result;
  }

  async checkOutWork(
    userIdx: number,
    { commuteDate, ...commuteInfo }: UpdateCheckOutInfo,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set(commuteInfo)
      .where('userIdx = :userIdx', { userIdx })
      .andWhere('commuteDate = :commuteDate', { commuteDate })
      .execute();
  }

  async getCommuteRecords(pageNo: number, perPage: number, filterInfo: AdminCommuteFilterDto) {
    const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'userEntity.id AS id',
        'userEntity.userName AS userName',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.overtimeWorkingMinutes AS overtimeWorkingMinutes',
        'commuteEntity.lateStatus AS lateStatus',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypEntity.leaveType AS leaveType',
        'commuteEntity.updateReason AS updateReason',
        'commuteEntity.earlyLeaveReason AS earlyLeaveReason',
        'commuteEntity.note AS note',
        'commuteEntity.checkInIpAddr AS checkInIpAddr',
        'commuteEntity.checkOutIpAddr AS checkOutIpAddr',
        'commuteEntity.checkInDeviceType AS checkInDeviceType',
        'commuteEntity.checkOutDeviceType AS checkOutDeviåceType',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.confirmDate AS confirmDate',
        'commuteEntity.createdAt AS createdAt',
        'commuteEntity.updatedAt AS updatedAt',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = commuteEntity.userIdx')
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('commuteEntity.commuteDate BETWEEN :sDate AND :eDate', {
        sDate: filterInfo.sDate,
        eDate: filterInfo.eDate,
      });

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('commuteEntity.createdAt', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const result = await query.getRawMany();

    return { totalPage, total, records: result };
  }

  async getCommuteCountByIdx(commuteIdx: number): Promise<number> {
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEntity.commuteIdx', { commuteIdx })
      .getCount();

    return result;
  }

  async getCommuteInfoByIdx(commuteIdx: number) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.checkInDeviceType AS checkInDeviceType',
        'commuteEntity.checkOutDeviceType AS checkOutDeviceType',
      ])
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawOne();

    return result;
  }

  async deleteCommute(commuteIdx: number, manager: EntityManager): Promise<DeleteResult> {
    return await manager
      .createQueryBuilder()
      .delete()
      .from(CommuteEntity)
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async updateCommuteTime(
    commuteIdx: number,
    updateInfo: UpdateCommuteTimeInfo,
    manager: EntityManager,
  ): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set(updateInfo)
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async updateCommuteNote(commuteIdx: number, noteInfo: UpdateNoteDto, manager: EntityManager): Promise<UpdateResult> {
    return await manager
      .createQueryBuilder()
      .update(CommuteEntity)
      .set(noteInfo)
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }
}
