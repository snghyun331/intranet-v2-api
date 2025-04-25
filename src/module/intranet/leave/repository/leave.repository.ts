import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { DeleteResult, InsertResult, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { LeaveDetailDto } from '../dto/createLeave.dto';
import { LeaveImageInfo } from '../interface/leave.interface';
import { ImageEntity } from '../../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../../entity/image/commuteHasImage.entity';
import { AdminLeaveFilterDto } from '../dto/query.dto';
import { LeaveStatsEntity } from '../../../../entity/intranet/leave/leaveStats.entity';
import { UserEntity } from '../../../../entity/user/user.entity';
import { GradeEntity } from '../../../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../../../entity/user/headquarter.entity';
import { TeamEntity } from '../../../../entity/user/team.entity';
import { ConfirmEnum, IntranetLeaveTypeIdxEnum } from '../../../../common/constant/enum';
import {
  getStartAndEndDateByMonth,
  getStartAndEndDateByYear,
  removeAllWhiteSpace,
} from '../../../../common/utils/utility';
import { LeaveTypeEntity } from '../../../../entity/intranet/leave/leaveType.entity';
import { CommuteApproverEntity } from '../../../../entity/intranet/commute/commuteApprover.entity';
import { LeaveUsageEntity } from '../../../../entity/intranet/leave/leaveUsage.entity';
import { LeaveMonthlyUsageEntity } from '../../../../entity/intranet/leave/leaveMonthlyUsage.entity';
import * as moment from 'moment';
import { CommuteCCUserEntity } from '../../../../entity/intranet/commute/commuteCCUser.entity';
import { UpdateNoteDto } from '../dto/updateNote.dto';
import { AdminLeaveSortEnum } from '../enum/leave.enum';
import { LeaveExtraEntity } from '../../../../entity/intranet/leave/leaveExtra.entity';
import { NewLeaveExtra } from '../interface/leaveExtra.interface';

@Injectable()
export class LeaveRepository {
  constructor(
    @InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>,
    @InjectRepository(LeaveStatsEntity) private readonly leaveStatsModel: Repository<LeaveStatsEntity>,
    @InjectRepository(LeaveMonthlyUsageEntity)
    private readonly leaveMonthlyUsageModel: Repository<LeaveMonthlyUsageEntity>,
    @InjectRepository(LeaveUsageEntity) private readonly leaveUsageModel: Repository<LeaveUsageEntity>,
    @InjectRepository(UserEntity) private readonly userModel: Repository<UserEntity>,
    @InjectRepository(ImageEntity) private readonly imageModel: Repository<ImageEntity>,
    @InjectRepository(CommuteHasImageEntity) private readonly commuteImageModel: Repository<CommuteHasImageEntity>,
    @InjectRepository(CommuteApproverEntity) private readonly commuteApproverModel: Repository<CommuteApproverEntity>,
    @InjectRepository(CommuteCCUserEntity) private readonly commuteCCModel: Repository<CommuteCCUserEntity>,
    @InjectRepository(LeaveExtraEntity) private readonly leaveExtraModel: Repository<LeaveExtraEntity>,
  ) {}

  async getUserInfoByIdx(userIdx: number) {
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select([
        'userEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.joinDate AS joinDate',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
      ])
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .getRawOne();

    return result;
  }

  async getLeaveInfoByIdx(commuteIdx: number) {
    const result: any = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawOne();

    return result;
  }

  async getLeaveImageInfoByIdx(commuteIdx: number) {
    const result: any = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteImageEntity.imageIdx AS imageIdx', 'imageEntity.imageName AS imageName'])
      .leftJoin(CommuteHasImageEntity, 'commuteImageEntity', 'commuteImageEntity.commuteIdx = commuteEntity.commuteIdx')
      .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = commuteImageEntity.imageIdx')
      .where('commuteEntity.commuteIdx = :commuteIdx', { commuteIdx })
      .getRawOne();

    return result;
  }

  async getCommuteIdxByDate(userIdx: number, commuteDate: string): Promise<number> {
    const { commuteIdx } = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.commuteIdx AS commuteIdx'])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    return commuteIdx;
  }

  async createLeave(
    leaveInfo: LeaveDetailDto,
    userIdx: number,
    note: string | null,
    leaveReduceUnit?: number | 0,
  ): Promise<number> {
    const result: InsertResult = await this.commuteModel
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ leaveTypeIdx: Number(leaveInfo.leaveTypeIdx), ...leaveInfo, note, userIdx, leaveReduceUnit })
      .execute();

    const commuteIdx: number = result.identifiers[0].commuteIdx;

    return commuteIdx;
  }

  /* 당일에 휴가를 등록할 때 사용하는 함수 */
  async updateLeave(commuteIdx: number, leaveTypeIdx: number, leaveReduceUnit?: number | 0): Promise<UpdateResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ leaveTypeIdx, leaveReduceUnit })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async autoApprove(commuteIdx: number, userIdx: number): Promise<UpdateResult> {
    const updateInfo = {
      confirmYN: ConfirmEnum.YES,
      confirmDate: moment().utcOffset(9).format('YYYY-MM-DD'),
      confirmPersonIdx: userIdx,
    };

    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set(updateInfo)
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .andWhere('userIdx = :userIdx', { userIdx })
      .execute();
  }

  async createLeaveImage(commuteIdx: number, imageInfo: LeaveImageInfo): Promise<void> {
    /* image entity */
    const result: InsertResult = await this.imageModel
      .createQueryBuilder()
      .insert()
      .into(ImageEntity)
      .values(imageInfo)
      .execute();

    const imageIdx: number = result.identifiers[0].imageIdx;

    /* commute_has_image entity */
    await this.commuteImageModel
      .createQueryBuilder()
      .insert()
      .into(CommuteHasImageEntity)
      .values({ commuteIdx, imageIdx })
      .execute();
  }

  async updateLeaveImage(imageIdx: number, imageInfo: LeaveImageInfo): Promise<UpdateResult> {
    return await this.imageModel
      .createQueryBuilder()
      .update(ImageEntity)
      .set(imageInfo)
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();
  }

  async deleteLeaveImage(imageIdx: number): Promise<void> {
    /* image entity */
    await this.imageModel
      .createQueryBuilder()
      .delete()
      .from(ImageEntity)
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();

    /* commute_has_image entity */
    await this.commuteImageModel
      .createQueryBuilder()
      .delete()
      .from(CommuteHasImageEntity)
      .where('imageIdx = :imageIdx', { imageIdx })
      .execute();
  }

  async getAnnualLeaveSummary(userIdx: number, year: string) {
    const defaultResult = {};

    const result = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.year AS year',
        'leaveStatsEntity.userIdx AS userIdx',
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance',
      ])
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    if (!result) {
      return defaultResult;
    }

    result.totalAnnualLeaveBalance = Number(result.totalAnnualLeaveBalance);

    return result;
  }

  async getLeaveSummaries(pageNo: number, perPage: number, filterInfo: AdminLeaveFilterDto) {
    const annualLeaveTypes = [
      IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE,
      IntranetLeaveTypeIdxEnum.PM_HALF,
      IntranetLeaveTypeIdxEnum.PM_QUARTER,
      IntranetLeaveTypeIdxEnum.AM_HALF,
      IntranetLeaveTypeIdxEnum.AM_QUARTER,
    ];

    // 서브쿼리: 사용자별 가장 최근 연차 사용일
    const subQuery: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS lastLeaveDate',
        `ROW_NUMBER() OVER (PARTITION BY commuteEntity.userIdx ORDER BY commuteEntity.createdAt DESC) AS rownum`,
      ])
      .where('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.YES })
      .andWhere('commuteEntity.leaveTypeIdx IN (:...leaveTypeIdx)', {
        leaveTypeIdx: annualLeaveTypes,
      });

    // 메인 쿼리: 사용자 연차 통계 + 최근 연차 사용일 조인
    const query: SelectQueryBuilder<LeaveStatsEntity> = this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.leaveStatsIdx AS leaveStatsIdx',
        'leaveStatsEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'userEntity.id AS id',
        'hqEntity.hqName AS hqName',
        'teamEntity.teamName AS teamName',
        'gradeEntity.gradeName AS gradeName',
        'leaveStatsEntity.year AS year',
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance',
        'leaveStatsEntity.note AS note',
        'recentLeave.lastLeaveDate AS lastLeaveDate',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = leaveStatsEntity.userIdx')
      .leftJoin(GradeEntity, 'gradeEntity', 'gradeEntity.gradeIdx = userEntity.gradeIdx')
      .leftJoin(HeadquarterEntity, 'hqEntity', 'hqEntity.hqIdx = userEntity.hqIdx')
      .leftJoin(TeamEntity, 'teamEntity', 'teamEntity.teamIdx = userEntity.teamIdx')
      .leftJoin(
        '(' + subQuery.getQuery() + ')',
        'recentLeave',
        'recentLeave.userIdx = leaveStatsEntity.userIdx AND recentLeave.rownum = 1',
      )
      .setParameters(subQuery.getParameters())
      .where('leaveStatsEntity.year = :year', { year: filterInfo.year });

    // 필터링 처리
    if (filterInfo.userName) {
      const userName: string = removeAllWhiteSpace(filterInfo.userName);
      query.andWhere('userEntity.userName = :userName', { userName });
    }

    // 총 갯수 및 페이징 계산
    const total: number = await query.getCount();
    const totalPage: number = Math.ceil(total / perPage);

    // 정렬 조건 처리
    if (filterInfo.sortby === AdminLeaveSortEnum.LAST_LEAVE) {
      const orderby: 'ASC' | 'DESC' = filterInfo.orderby.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query.orderBy('recentLeave.lastLeaveDate', orderby);
    } else {
      query.orderBy('userEntity.createdAt', 'DESC');
    }

    // 페이징 처리
    const leaveStatsList = await query
      .limit(perPage)
      .offset((pageNo - 1) * perPage)
      .getRawMany();

    const result = leaveStatsList.map((leaveStats) => ({
      userIdx: leaveStats.userIdx,
      ...leaveStats,
      totalAnnualLeaveBalance: Number(leaveStats.totalAnnualLeaveBalance),
      lastLeaveDate: leaveStats.lastLeaveDate ?? null,
    }));

    return { totalPage, total, summaries: result };
  }

  async getUserCountByIdx(userIdx: number): Promise<number> {
    const userCnt: number = await this.userModel
      .createQueryBuilder('userEntity')
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('userEntity.userAvail IS NULL')
      .getCount();

    return userCnt;
  }

  async getUserLeaveStats(year: string, userIdx: number) {
    const result = await this.leaveStatsModel
      .createQueryBuilder('leaveStatsEntity')
      .select([
        'leaveStatsEntity.totalReceivedAnnualLeave AS totalReceivedAnnualLeave',
        'leaveStatsEntity.totalAnnualLeaveUsage AS totalAnnualLeaveUsage',
        '(leaveStatsEntity.totalReceivedAnnualLeave - leaveStatsEntity.totalAnnualLeaveUsage) AS totalAnnualLeaveBalance', // 잔여 연차 개수
        'leaveStatsEntity.midJoinReceivedAnnualLeave AS midJoinReceivedAnnualLeave',
        'leaveStatsEntity.totalReceivedSpecialLeave AS totalReceivedSpecialLeave',
        'leaveStatsEntity.totalSpecialLeaveUsage AS totalSpecialLeaveUsage',
        'leaveStatsEntity.totalReceivedAlternativeLeave AS totalReceivedAlternativeLeave',
        'leaveStatsEntity.totalAlternativeLeaveUsage AS totalAlternativeLeaveUsage',
      ])
      .where('leaveStatsEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveStatsEntity.year = :year', { year })
      .getRawOne();

    return result;
  }

  async getNotConfirmLeaveCount(userIdx: number, year: string): Promise<number> {
    const { firstDayOfYear, lastDayOfYear } = getStartAndEndDateByYear(year);
    const result: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['commuteEntity.commuteIdx AS commuteIdx'])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: ConfirmEnum.NO })
      .andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', {
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      })
      .andWhere('commuteEntity.commuteDate BETWEEN :firstDayOfYear AND :lastDayOfYear', {
        firstDayOfYear,
        lastDayOfYear,
      })
      .getCount();

    return result;
  }

  async getUserLeaveUsageInfo(year: string, userIdx: number) {
    const result = await this.leaveUsageModel
      .createQueryBuilder('leaveUsageEntity')
      .select(['leaveUsageEntity.leaveTypeIdx AS leaveTypeIdx', 'leaveUsageEntity.annualUseCount AS annualUseCount'])
      .where('leaveUsageEntity.userIdx = :userIdx', { userIdx })
      .andWhere('leaveUsageEntity.year = :year', { year })
      .getRawMany();

    return result;
  }

  // // 추후 쿼리 튜닝 필요,,
  // async getUserLeaveDetail(filterInfo: UserLeaveDetailFilterDto | AdminLeaveDetailFilterDto, userIdx: number) {
  //   // startDate과 endDate 계산
  //   const { year, month, leaveTypeIdx } = filterInfo;
  //   const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
  //     .createQueryBuilder('commuteEntity')
  //     .select([
  //       'commuteEntity.commuteIdx AS commuteIdx',
  //       'commuteEntity.userIdx AS userIdx',
  //       'commuteEntity.commuteDate AS commuteDate',
  //       'DAYNAME(commuteEntity.commuteDate) AS commuteDayName',
  //       'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
  //       'leaveTypeEntity.leaveType AS leaveType',
  //       'commuteImageEntity.imageIdx AS imageIdx',
  //       'imageEntity.imageName AS imageName',
  //       'imageEntity.imageSize AS imageSize',
  //       'imageEntity.imageUrl AS imageUrl',
  //       'commuteEntity.leaveReduceUnit AS leaveReduceUnit',
  //       'commuteEntity.note AS note',
  //       'commuteEntity.confirmYN AS confirmYN',
  //       'commuteEntity.confirmDate AS confirmDate',
  //       'commuteEntity.rejectDate AS rejectDate',
  //       'commuteEntity.confirmPersonIdx AS confirmPersonIdx',
  //       'confirmUserEntity.userName AS confirmPersonName',
  //       'commuteEntity.createdAt AS createdAt',
  //       'commuteEntity.updatedAt AS updatedAt',

  //       // 추가: 승인 가능자 정보 가져오기
  //       'commuteApproverEntity.approverIdx AS approverIdx',
  //       'approverUserEntity.userName AS approverName',

  //       // 추가: 참조자 정보 가져오기
  //       'commuteCCUserEntity.ccUserIdx AS ccUserIdx',
  //       'ccUserEntity.userName AS ccUserName',
  //     ])
  //     .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
  //     .leftJoin(CommuteHasImageEntity, 'commuteImageEntity', 'commuteImageEntity.commuteIdx = commuteEntity.commuteIdx')
  //     .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = commuteImageEntity.imageIdx')
  //     .leftJoin(UserEntity, 'confirmUserEntity', 'confirmUserEntity.userIdx = commuteEntity.confirmPersonIdx')
  //     .leftJoin(
  //       CommuteApproverEntity,
  //       'commuteApproverEntity',
  //       'commuteApproverEntity.commuteIdx = commuteEntity.commuteIdx',
  //     )
  //     .leftJoin(UserEntity, 'approverUserEntity', 'approverUserEntity.userIdx = commuteApproverEntity.approverIdx')
  //     .leftJoin(CommuteCCUserEntity, 'commuteCCUserEntity', 'commuteCCUserEntity.commuteIdx = commuteEntity.commuteIdx')
  //     .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = commuteCCUserEntity.ccUserIdx')
  //     .where('commuteEntity.userIdx = :userIdx', { userIdx })
  //     .andWhere('YEAR(commuteEntity.commuteDate) = :year', { year });

  //   query.orderBy('commuteEntity.createdAt', 'ASC'); // 누적 잔여 연차 수 계산을 위한 createdAt 기준 오름차순 정렬

  //   if (month) {
  //     query.andWhere('MONTH(commuteEntity.commuteDate) IN (:...month)', { month });
  //   }

  //   if (leaveTypeIdx) {
  //     query.andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx });
  //   } else {
  //     query.andWhere('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', {
  //       leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
  //     });
  //   }

  //   if ('confirmYN' in filterInfo && filterInfo.confirmYN) {
  //     query.andWhere('commuteEntity.confirmYN = :confirmYN', { confirmYN: filterInfo.confirmYN });
  //   }

  //   const result = await query.getRawMany();

  //   return result;
  // }

  // 추후 쿼리 튜닝 필요,,
  async getUserLeaveDetail(year: string, userIdx: number) {
    // startDate과 endDate 계산
    const query: SelectQueryBuilder<CommuteEntity> = this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'commuteEntity.commuteDate AS commuteDate',
        'DAYNAME(commuteEntity.commuteDate) AS commuteDayName',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteImageEntity.imageIdx AS imageIdx',
        'imageEntity.imageName AS imageName',
        'imageEntity.imageSize AS imageSize',
        'imageEntity.imageUrl AS imageUrl',
        'commuteEntity.leaveReduceUnit AS leaveReduceUnit',
        'commuteEntity.note AS note',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.confirmDate AS confirmDate',
        'commuteEntity.rejectDate AS rejectDate',
        'commuteEntity.confirmPersonIdx AS confirmPersonIdx',
        'confirmUserEntity.userName AS confirmPersonName',
        'commuteEntity.createdAt AS createdAt',
        'commuteEntity.updatedAt AS updatedAt',

        // 추가: 승인 가능자 정보 가져오기
        'commuteApproverEntity.approverIdx AS approverIdx',
        'approverUserEntity.userName AS approverName',

        // 추가: 참조자 정보 가져오기
        'commuteCCUserEntity.ccUserIdx AS ccUserIdx',
        'ccUserEntity.userName AS ccUserName',
      ])
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .leftJoin(CommuteHasImageEntity, 'commuteImageEntity', 'commuteImageEntity.commuteIdx = commuteEntity.commuteIdx')
      .leftJoin(ImageEntity, 'imageEntity', 'imageEntity.imageIdx = commuteImageEntity.imageIdx')
      .leftJoin(UserEntity, 'confirmUserEntity', 'confirmUserEntity.userIdx = commuteEntity.confirmPersonIdx')
      .leftJoin(
        CommuteApproverEntity,
        'commuteApproverEntity',
        'commuteApproverEntity.commuteIdx = commuteEntity.commuteIdx',
      )
      .leftJoin(UserEntity, 'approverUserEntity', 'approverUserEntity.userIdx = commuteApproverEntity.approverIdx')
      .leftJoin(CommuteCCUserEntity, 'commuteCCUserEntity', 'commuteCCUserEntity.commuteIdx = commuteEntity.commuteIdx')
      .leftJoin(UserEntity, 'ccUserEntity', 'ccUserEntity.userIdx = commuteCCUserEntity.ccUserIdx')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('YEAR(commuteEntity.commuteDate) = :year', { year })
      .andWhere('leaveTypeEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', {
        leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL,
      });

    query.orderBy('commuteEntity.commuteDate', 'ASC'); // 누적 잔여 연차 수 계산을 위한 commuteDate 기준 오름차순 정렬

    const result = await query.getRawMany();

    return result;
  }

  async getHealthLeaveCountInMonth(userIdx: number, year: string, month: string): Promise<number> {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');
    const count: number = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.leaveTypeIdx = :leaveTypeIdx', { leaveTypeIdx: IntranetLeaveTypeIdxEnum.HEALTH_LEAVE })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .getCount();

    return count;
  }

  async getAllLeaveCalender(year: string, month: string) {
    const { firstDayOfMonth, lastDayOfMonth } = getStartAndEndDateByMonth(year, month);
    const startDate: string = firstDayOfMonth.format('YYYY-MM-DD');
    const endDate: string = lastDayOfMonth.format('YYYY-MM-DD');

    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select([
        'commuteEntity.commuteIdx AS commuteIdx',
        'commuteEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'commuteEntity.commuteDate AS commuteDate',
        'commuteEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'commuteEntity.checkInTime AS checkInTime',
        'commuteEntity.checkOutTime AS checkOutTime',
        'commuteEntity.confirmYN AS confirmYN',
        'commuteEntity.createdAt AS createdAt',
      ])
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = commuteEntity.leaveTypeIdx')
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = commuteEntity.userIdx')
      .where('commuteEntity.leaveTypeIdx NOT IN (:leaveTypeIdx)', { leaveTypeIdx: IntranetLeaveTypeIdxEnum.NORMAL })
      .andWhere('commuteEntity.commuteDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .orderBy('commuteEntity.commuteDate', 'ASC')
      .getRawMany();

    return result;
  }

  async createLeaveApproverList(commuteIdx: number, approverIdxs: number[]): Promise<void> {
    for (const approverIdx of approverIdxs) {
      await this.commuteApproverModel
        .createQueryBuilder()
        .insert()
        .into(CommuteApproverEntity)
        .values({ commuteIdx, approverIdx: Number(approverIdx) })
        .execute();
    }

    return;
  }

  async createLeaveCCUserList(commuteIdx: number, ccUserIdxList: number[]): Promise<void> {
    for (const ccUserIdx of ccUserIdxList) {
      await this.commuteCCModel
        .createQueryBuilder()
        .insert()
        .into(CommuteCCUserEntity)
        .values({ commuteIdx, ccUserIdx: Number(ccUserIdx) })
        .execute();
    }

    return;
  }

  async deleteLeave(commuteIdx: number): Promise<DeleteResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .delete()
      .from(CommuteEntity)
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async createLeaveForE2ETest(
    leaveInfo: LeaveDetailDto,
    userIdx: number,
    note: string | null,
    confirmYN: ConfirmEnum,
  ): Promise<number> {
    const result: InsertResult = await this.commuteModel
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ ...leaveInfo, note, userIdx, confirmYN }) // 승인 강제 (테스트 목적)
      .execute();

    const commuteIdx: number = result.identifiers[0].commuteIdx;

    return commuteIdx;
  }

  async updateUserTotalReceivedAnnualLeave(
    leaveStatsIdx: number,
    totalReceivedAnnualLeave: number,
  ): Promise<UpdateResult> {
    return await this.leaveStatsModel
      .createQueryBuilder()
      .update(LeaveStatsEntity)
      .set({ totalReceivedAnnualLeave })
      .where('leaveStatsIdx = :leaveStatsIdx', { leaveStatsIdx })
      .execute();
  }

  async updateLeaveNote(commuteIdx: number, { note }: UpdateNoteDto): Promise<UpdateResult> {
    return await this.commuteModel
      .createQueryBuilder()
      .update(CommuteEntity)
      .set({ note })
      .where('commuteIdx = :commuteIdx', { commuteIdx })
      .execute();
  }

  async isBirthday(userIdx: number, commuteDate: string): Promise<boolean> {
    const date: string = commuteDate.slice(5);
    const result = await this.userModel
      .createQueryBuilder('userEntity')
      .select(['userEntity.userIdx AS userIdx'])
      .where('userEntity.userIdx = :userIdx', { userIdx })
      .andWhere('DATE_FORMAT(userEntity.userBirth, "%m-%d") = :date', { date })
      .getRawOne();

    return !!result;
  }

  async getTotalLeaveReduceUnitByDate(userIdx: number, commuteDate: string): Promise<number> {
    const result = await this.commuteModel
      .createQueryBuilder('commuteEntity')
      .select(['SUM(commuteEntity.leaveReduceUnit) AS total'])
      .where('commuteEntity.userIdx = :userIdx', { userIdx })
      .andWhere('commuteEntity.commuteDate = :commuteDate', { commuteDate })
      .getRawOne();

    return parseFloat(result?.total ?? 0);
  }

  async createExtraLeave(newLeaveExtra: NewLeaveExtra): Promise<InsertResult> {
    return await this.leaveExtraModel
      .createQueryBuilder()
      .insert()
      .into(LeaveExtraEntity)
      .values(newLeaveExtra)
      .execute();
  }

  async updateExtraLeave(leaveExtraIdx: number, newLeaveExtra: NewLeaveExtra): Promise<UpdateResult> {
    return await this.leaveExtraModel
      .createQueryBuilder()
      .update(LeaveExtraEntity)
      .set(newLeaveExtra)
      .where('leaveExtraIdx = :leaveExtraIdx', { leaveExtraIdx })
      .execute();
  }

  async updateTotalReceivedLeave(userIdx: number, leaveTypeIdx: number, year: string): Promise<UpdateResult> {
    const query = `(
        SELECT COALESCE(SUM(extra_leave), 0) 
        FROM leave_extra
        WHERE leave_extra.user_idx = ${userIdx}
        AND leave_extra.leave_type_idx = ${leaveTypeIdx}
        AND leave_extra.year = ${year}
      )`;

    if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE) {
      return await this.leaveStatsModel
        .createQueryBuilder()
        .update(LeaveStatsEntity)
        .set({ totalReceivedSpecialLeave: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .execute();
    }

    if (leaveTypeIdx === IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE) {
      return await this.leaveStatsModel
        .createQueryBuilder()
        .update(LeaveStatsEntity)
        .set({ totalReceivedAlternativeLeave: () => query })
        .where('userIdx = :userIdx', { userIdx })
        .andWhere('year = :year', { year })
        .execute();
    }
  }

  async getExtraLeaveInfoByYear(year: string) {
    const result = await this.leaveExtraModel
      .createQueryBuilder('leaveExtraEntity')
      .select([
        'leaveExtraEntity.leaveExtraIdx AS leaveExtraIdx',
        'leaveExtraEntity.userIdx AS userIdx',
        'userEntity.userName AS userName',
        'leaveExtraEntity.year AS year',
        'leaveExtraEntity.leaveTypeIdx AS leaveTypeIdx',
        'leaveTypeEntity.leaveType AS leaveType',
        'leaveExtraEntity.extraLeave AS extraLeave',
        'leaveExtraEntity.adminName AS adminName',
        'leaveExtraEntity.note AS note',
        'leaveExtraEntity.createdAt AS createdAt',
        'leaveExtraEntity.updatedAt AS updatedAt',
      ])
      .innerJoin(UserEntity, 'userEntity', 'userEntity.userIdx = leaveExtraEntity.userIdx')
      .innerJoin(LeaveTypeEntity, 'leaveTypeEntity', 'leaveTypeEntity.leaveTypeIdx = leaveExtraEntity.leaveTypeIdx')
      .where('leaveExtraEntity.year = :year', { year })
      .orderBy('leaveExtraEntity.createdAt', 'DESC')
      .getRawMany();

    return result;
  }

  async getExtraLeaveInfoByIdx(leaveExtraIdx: number) {
    const result = await this.leaveExtraModel
      .createQueryBuilder('leaveExtraEntity')
      .select([
        'leaveExtraEntity.userIdx AS userIdx',
        'leaveExtraEntity.year AS year',
        'leaveExtraEntity.leaveTypeIdx AS leaveTypeIdx',
      ])
      .where('leaveExtraEntity.leaveExtraIdx = :leaveExtraIdx', { leaveExtraIdx })
      .getRawOne();

    return result;
  }

  async deleteExtraLeave(leaveExtraIdx: number): Promise<DeleteResult> {
    return await this.leaveExtraModel
      .createQueryBuilder()
      .delete()
      .from(LeaveExtraEntity)
      .where('leaveExtraIdx = :leaveExtraIdx', { leaveExtraIdx })
      .execute();
  }
}
