import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from '../dto/query.dto';
import { UserEntity } from '@entity/user/user.entity';
import { GradeEntity } from '@entity/user/grade.entity';
import { TeamEntity } from '@entity/user/team.entity';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { LeaveTypeEntity } from '@entity/intranet/leave/leaveType.entity';
import { addConfirmStatusField, removeAllWhiteSpace } from '@common/utils/utility';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum, YNEnum } from '@common/constant/enum';
import { InsertCheckInInfo, UpdateCheckInInfo, UpdateCheckOutInfo, UpdateCommuteTimeInfo } from '../interface';
import { AdminCommuteSortEnum } from '../enum/commute.enum';

@Injectable()
export class CommuteRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async createCheckInWork(userIdx: number, commuteInfo: InsertCheckInInfo): Promise<InsertResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, ...commuteInfo })
      .execute();
  }

  async createTodayCommute(userIdx: number, commuteDate: string): Promise<InsertResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ userIdx, commuteDate })
      .execute();
  }

  async updateCheckInWork(userIdx: number, { commuteDate, ...commuteInfo }: UpdateCheckInInfo): Promise<UpdateResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ ...commuteInfo })
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
        'commuteEntity.attendance AS attendance',
        'commuteEntity.confirmYN AS confirmYN',
      ])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    return result;
  }

  async checkOutWork(userIdx: number, { commuteDate, ...commuteInfo }: UpdateCheckOutInfo): Promise<UpdateResult> {
    return await this.commuteModel
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
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.overtimeWorkingMinutes AS overtimeWorkingMinutes',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteEntity.updateReason AS updateReason',
        'commuteEntity.earlyLeaveReason AS earlyLeaveReason',
        'commuteEntity.note AS note',
        'commuteEntity.checkInIpAddr AS checkInIpAddr',
        'commuteEntity.checkOutIpAddr AS checkOutIpAddr',
        'commuteEntity.checkInLogAgent AS checkInLogAgent',
        'commuteEntity.checkOutLogAgent AS checkOutLogAgent',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.confirmDate AS confirmDate',
        'commuteEntity.rejectDate AS rejectDate',
        'commuteEntity.adminUpdatedAt AS adminUpdatedAt',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = commuteEntity.userIdx')
      .leftJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .where('commuteEntity.commuteDate BETWEEN :sDate AND :eDate', {
        sDate: filterInfo.sDate,
        eDate: filterInfo.eDate,
      })
      .andWhere('userEntity.userAvail = :userAvail', { userAvail: YNEnum.YES });

    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    // 정렬 조건 처리
    if (filterInfo.sortby === AdminCommuteSortEnum.CHECK_IN_TIME) {
      query.orderBy('commuteEntity.checkInTime', 'DESC');
    } else {
      query.orderBy('commuteEntity.commuteDate', 'DESC').addOrderBy('userEntity.userName', 'ASC');
    }

    // 페이징 처리
    const records = await query
      .limit(perPage)
      .offset((pageNo - 1) * perPage)
      .getRawMany();

    // 승인여부와 날짜를 합친 새 필드 추가
    const result = await Promise.all(
      records.map(async (record) => {
        const confirmStatus: string = addConfirmStatusField(record.confirmYN, record.confirmDate, record.rejectDate);

        return {
          ...record,
          confirmStatus,
        };
      }),
    );

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
        'commuteEntity.checkInLogAgent AS checkInLogAgent',
        'commuteEntity.checkOutLogAgent AS checkOutLogAgent',
      ])
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawOne();

    return result;
  }

  async deleteCommute(commuteIdx: number): Promise<UpdateResult> {
    const commuteNull = {
      checkInTime: null,
      checkOutTime: null,
      attendance: null,
      leaveTypeIdx: null,
      workingMinutes: null,
      overtimeWorkingMinutes: null,
      updateReason: null,
      earlyLeaveReason: null,
      note: null,
      checkInIpAddr: null,
      checkOutIpAddr: null,
      checkInLogAgent: null,
      checkOutLogAgent: null,
      confirmYN: ConfirmEnum.NO,
      confirmDate: null,
      rejectDate: null,
      confirmPersonIdx: null,
      adminUpdatedAt: null,
      leaveReduceUnit: 0,
    };

    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ ...commuteNull })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();

    // return await this.commuteModel
    //   .createQueryBuilder()
    //   .delete()
    //   .from(CommuteEntity)
    //   .where('commuteIdx = :commuteIdx', { commuteIdx })
    //   .execute();
  }

  async updateCommuteTime(commuteIdx: number, updateInfo: UpdateCommuteTimeInfo): Promise<UpdateResult> {
    const adminUpdatedAt: Date = new Date();

    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ ...updateInfo, adminUpdatedAt })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async updateCommuteNote(commuteIdx: number, noteInfo: UpdateNoteDto): Promise<UpdateResult> {
    const adminUpdatedAt: Date = new Date();

    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ ...noteInfo, adminUpdatedAt })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async getUserCommuteRecords(userIdx: number, pageNo: number, perPage: number, filterInfo: UserCommuteFilterDto) {
    const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.workingMinutes AS workingMinutes',
        'commuteEntity.overtimeWorkingMinutes AS overtimeWorkingMinutes',
        'commuteEntity.attendance AS attendance',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteEntity.updateReason AS updateReason',
        'commuteEntity.earlyLeaveReason AS earlyLeaveReason',
        'commuteEntity.note AS note',
        'commuteEntity.checkInIpAddr AS checkInIpAddr',
        'commuteEntity.checkOutIpAddr AS checkOutIpAddr',
        'commuteEntity.checkInLogAgent AS checkInLogAgent',
        'commuteEntity.checkOutLogAgent AS checkOutLogAgent',
        'commuteEntity.adminUpdatedAt AS adminUpdatedAt',
      ])
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate BETWEEN :sDate AND :eDate', {
        sDate: filterInfo.sDate,
        eDate: filterInfo.eDate,
      });

    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    query
      .orderBy('commuteEntity.commuteDate', 'DESC')
      .limit(perPage)
      .offset((pageNo - 1) * perPage);

    const records = await query.getRawMany();

    // 승인여부와 날짜를 합친 새 필드 추가
    const result = await Promise.all(
      records.map(async (record) => {
        const confirmStatus: string = addConfirmStatusField(record.confirmYN, record.confirmDate, record.rejectDate);

        return {
          ...record,
          confirmStatus,
        };
      }),
    );

    return { totalPage, total, records: result };
  }

  async getUserWorkHoursByMonth(userIdx: number, startDate: string, endDate: string) {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.commuteDate AS commuteDate', `commuteEntity.working_minutes AS workingMinutes`])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getRawMany();

    return result;
  }
}
