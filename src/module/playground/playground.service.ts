import * as moment from 'moment';
import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CreateLunchGroupDto } from './dto/createLunchGroup.dto';
import { PlayGroundModel } from './model/playground.model';
import { SetLunchGroup } from './interface/lunchGroup.interface';
import { RedisLockService } from '@redis/redisLock.service';
import { PICK_LUNCH_LOCK_DURATION } from '@common/constant/constant';
import { CreateMonthlyBaverageDto } from './dto/createMonthlyBaverage.dto';
import { GlobalUserRepository } from '../global/repository/globalUser.repository';
import { BaverageConfig } from '../../schema/baverage/baverageConfig.schema';
import { UpdateBaverage } from './dto/updateBaverage.dto';
import { BaverageEnum } from './enum/playground.enum';

@Injectable()
export class PlaygroundService {
  constructor(
    private readonly playgroupundModel: PlayGroundModel,
    private readonly redisLockService: RedisLockService,
    private readonly userRepository: GlobalUserRepository,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  async pickLunchGroup(userName: string): Promise<number> {
    const lockKey: string = 'PICK_LUNCH_GROUP';
    const lock: boolean = await this.redisLockService.waitAndSetLock(lockKey, PICK_LUNCH_LOCK_DURATION);

    try {
      const lunchGroupConfig = await this.playgroupundModel.findLatestLunchGroupConfig();
      if (!lunchGroupConfig) {
        throw new BadRequestException('지금은 뽑기 가능 시간이 아닙니다.');
      }

      const { _id: configId, groupInfo } = lunchGroupConfig;

      // 이미 배정되었는지 확인
      const isExistingAssignment = await this.playgroupundModel.checkUserAssignedToLunchGroup(configId, userName);
      if (isExistingAssignment) {
        throw new BadRequestException('이미 조에 배정되었습니다.');
      }

      // 배정 받을 그룹 넘버 초기화
      let groupToAssign: number | null = null;
      if (lock) {
        // 모든 그룹의 현재 멤버 수 조회
        const groupCounts = await this.playgroupundModel.getUserCountByLunchGroup(configId);

        // 그룹별 멤버 수를 객체로 변환
        const groupSizeMap = new Map<number, number>();
        groupCounts.forEach((group) => groupSizeMap.set(group._id, group.count));

        // 배정 가능한 그룹들 찾기
        const availableGroups: number[] = [];
        groupInfo.forEach((info) => {
          const currentSize = groupSizeMap.get(info.groupNo) || 0;
          if (currentSize < info.availMemberCount) {
            availableGroups.push(info.groupNo);
          }
        });
        // 배정 가능한 그룹이 있으면 랜덤하게 선택
        if (availableGroups.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableGroups.length);
          groupToAssign = availableGroups[randomIndex];
        } else {
          throw new BadRequestException('배정 가능한 그룹이 없습니다.');
        }

        // 배정된 그룹에 멤버 추가
        await this.playgroupundModel.addUserInLunchGroup(configId, groupToAssign, userName);

        await this.redisLockService.delLock(lockKey);
      }
      return groupToAssign;
    } catch (err) {
      await this.redisLockService.delLock(lockKey);
      this.logger.error(err);
      throw err;
    }
  }

  async setLunchGroup({ total, perGroup, sDate, eDate, notice }: CreateLunchGroupDto): Promise<void> {
    if (total <= 0 || perGroup <= 0) {
      throw new BadRequestException('총 인원과 한 조에 들어갈 인원은 1명 이상이어야 합니다.');
    }
    const totalGroups: number = Math.floor(total / perGroup);
    const remainingMembers: number = total % perGroup;
    // 나머지 인원이 있으면 기존 그룹들 중 랜덤하게 선택해서 1명씩 추가
    const groupInfo = [];
    for (let i = 1; i <= totalGroups; i++) {
      groupInfo.push({
        groupNo: i,
        availMemberCount: perGroup,
      });
    }

    // 나머지 인원을 랜덤하게 분배
    if (remainingMembers > 0) {
      for (let i = 0; i < remainingMembers; i++) {
        // 0 ~ totalGroups - 1 사이의 랜덤한 인덱스 선택
        const randomIndex = Math.floor(Math.random() * totalGroups);
        groupInfo[randomIndex].availMemberCount += 1;
      }
    }

    const expireAt: Date = moment(eDate).utcOffset(9).endOf('day').toDate(); // eDate 값을 Date형으로 변환
    const insertValue: SetLunchGroup = {
      total,
      perGroup,
      totalGroups,
      groupInfo,
      sDate,
      eDate,
      notice,
      expireAt,
    };
    await this.playgroupundModel.createLunchGroupConfig(insertValue);

    return;
  }

  async getLunchGroupForAdmin(): Promise<any> {
    const defaultResult = {
      sDate: null,
      eDate: null,
      total: null,
      perGroup: null,
      notice: null,
      groupInfo: [],
      groups: {},
    };

    // 가장 최신의 점심조 설정 데이터 조회
    const lunchGroupConfig = await this.playgroupundModel.findLatestLunchGroupConfig();
    if (!lunchGroupConfig) {
      return defaultResult;
    }
    const { sDate, eDate, notice, totalGroups, _id: configId, total, perGroup, groupInfo } = lunchGroupConfig;
    const groups: Record<string, string[]> = {};
    for (let i = 1; i <= totalGroups; i++) {
      groups[i.toString()] = [];
    }

    const lunchGroupMembers = await this.playgroupundModel.findLunchGroupMembers(configId);

    for (const member of lunchGroupMembers) {
      const groupNo = member.groupNo.toString();
      groups[groupNo].push(member.userName);
    }

    return { sDate, eDate, total, perGroup, notice, groupInfo, groups };
  }

  async getLunchGroupForUser(userName: string): Promise<any> {
    const defaultResult = {
      sDate: null,
      eDate: null,
      total: null,
      perGroup: null,
      notice: null,
      groupInfo: [],
      groups: {},
    };

    // 가장 최신의 점심조 설정 데이터 조회
    const lunchGroupConfig = await this.playgroupundModel.findLatestLunchGroupConfig();
    if (!lunchGroupConfig) {
      return defaultResult;
    }

    const { sDate, eDate, notice, totalGroups, _id: configId, groupInfo } = lunchGroupConfig;

    let groupToAssign: string | null = null;
    const groups: Record<string, string[]> = {};

    for (let i = 1; i <= totalGroups; i++) {
      groups[i.toString()] = [];
    }

    const lunchGroupMembers = await this.playgroupundModel.findLunchGroupMembers(configId);

    for (const member of lunchGroupMembers) {
      const groupNo = member.groupNo.toString();
      groups[groupNo].push(member.userName);

      // 본인이 배정받은 그룹 찾기
      if (member.userName === userName) {
        groupToAssign = member.groupNo.toString();
      }
    }

    return { sDate, eDate, notice, groupInfo, groups, groupToAssign };
  }

  async deleteLunchGroupConfig(): Promise<void> {
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    const existLunchGroupConfig = await this.playgroupundModel.findAvailableLunchGroupConfig(nowDate);
    if (!existLunchGroupConfig) {
      throw new BadRequestException('삭제할 수 있는 유효한 점심조가 없습니다.');
    }
    const configId: object = existLunchGroupConfig._id;
    await this.playgroupundModel.deleteLunchGroupConfig(configId);

    return;
  }

  async setMonthlyBaverage(monthlyBaverage: CreateMonthlyBaverageDto): Promise<void> {
    /* 설정 config을 생성 및 업데이트 한다. */
    const insertValue: BaverageConfig = { ...monthlyBaverage };
    const configId = await this.playgroupundModel.findAndUpdateBaverageConfig(insertValue);

    /* 모든 직원에 대한 음료 주문 내역을 생성 및 업데이트 한다 */
    const userNames: string[] = await this.userRepository.getAllUserNames();
    const operations = userNames.map((userName) => ({
      updateOne: {
        filter: { configId, userName },
        update: { $setOnIsert: { baverage: null } },
        upsert: true,
      },
    }));

    await this.playgroupundModel.createAndUpdateBaverageMember(operations);

    return;
  }

  async getMonthlyBaverageForAdmin(month: string) {
    const allBaverages = Object.values(BaverageEnum);
    const defaultResult = {
      config: {
        month,
        pickup: [],
        dueDate: null,
        configId: null,
      },
      countStats: [],
      details: [],
      myBaverage: allBaverages.map((baverage) => ({
        baverage,
        count: 0,
      })),
    };

    /* 음료 설정 정보 */
    const config = await this.playgroupundModel.findBaverageConfigByMonth(month);
    if (!config) {
      return defaultResult;
    }
    const { _id, ...rest } = config;
    const renamedConfig = { configId: _id, ...rest };

    /* 음료 종류별 총 잔 수 집계 */
    const countStatsRaw = await this.playgroupundModel.getBaverageCountStats(_id);
    // 집계 결과를 Map으로 변환
    const countMap = new Map(countStatsRaw.map((item) => [item.baverage, item.count]));
    // 모든 음료 종류에 대해 count 채워넣기
    const countStats = allBaverages.map((baverage: string | null) => ({
      baverage: baverage ?? BaverageEnum.NONE,
      count: countMap.get(baverage) ?? 0,
    }));

    /* 직원별 음료 신청 현황 내역 */
    const details = await this.playgroupundModel.getBaverageDetails(_id);

    const result = { config: renamedConfig, countStats, details };

    return result;
  }

  async updateMonthlyBaverage({ configId, userName, baverage }: UpdateBaverage): Promise<void> {
    await this.playgroupundModel.updateBaverage(configId, userName, baverage);

    return;
  }

  async getMonthlyBaverageForUser(month: string, userName: string) {
    const defaultResult = {
      config: {
        month,
        pickup: [],
        dueDate: null,
        configId: null,
      },
      details: [],
      myBaverage: null,
    };
    const config = await this.playgroupundModel.findBaverageConfigByMonth(month);
    // 어드민에서 설정한 정보가 없다면,
    if (!config) {
      return defaultResult;
    }

    /* 음료 설정 정보 */
    const { _id, ...rest } = config;
    const renamedConfig = { configId: _id, ...rest };

    /* 직원별 음료 신청 현황 내역 */
    const details = await this.playgroupundModel.getBaverageDetails(_id);
    /* 내가 신청한 음료 */
    const myBaverage = await this.playgroupundModel.getMyBaverage(_id, userName);

    const result = { config: renamedConfig, details, myBaverage: myBaverage ? myBaverage.baverage : 'NONE' };

    return result;
  }
}
