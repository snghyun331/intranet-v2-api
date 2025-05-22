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
import { BaverageMember } from '../../schema/baverage/baverageMember.schema';

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

      const { _id: configId, maxGroup, perGroup, extraGroupCount } = lunchGroupConfig;

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

        while (true) {
          const groupNo: number = Math.floor(Math.random() * maxGroup) + 1;
          const currentSize = groupSizeMap.get(groupNo) || 0;

          // 기본 그룹 배정
          if (currentSize < perGroup && groupToAssign === null) {
            groupToAssign = groupNo;
            break;
          }
          // 초과 인원 그룹 배정 (여유가 있을 경우)
          if (currentSize < perGroup + 1 && extraGroupCount > 0) {
            groupToAssign = groupNo;
            break;
          }
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
    const maxGroup: number = Math.floor(total / perGroup);
    const extraGroupCount: number = total % perGroup === 0 ? 0 : total % perGroup;
    const expireAt: Date = moment(eDate).utcOffset(9).endOf('day').toDate(); // eDate 값을 Date형으로 변환
    const insertValue: SetLunchGroup = {
      total,
      perGroup,
      maxGroup,
      extraGroupCount,
      sDate,
      eDate,
      notice,
      expireAt,
    };
    await this.playgroupundModel.createLunchGroupConfig(insertValue);

    return;
  }

  async getLunchGroupForAdmin(): Promise<any> {
    // 가장 최신의 점심조 설정 데이터 조회
    const lunchGroupConfig = await this.playgroupundModel.findLatestLunchGroupConfig();
    if (!lunchGroupConfig) {
      return [];
    }

    const { sDate, eDate, notice, maxGroup, _id: configId, total, perGroup } = lunchGroupConfig;

    const groups: Record<string, string[]> = {};

    for (let i = 1; i <= maxGroup; i++) {
      groups[i.toString()] = [];
    }

    const lunchGroupMembers = await this.playgroupundModel.findLunchGroupMembers(configId);

    for (const member of lunchGroupMembers) {
      const groupNo = member.groupNo.toString();
      groups[groupNo].push(member.userName);
    }

    return { sDate, eDate, total, perGroup, notice, groups };
  }

  async getLunchGroupForUser(userName: string): Promise<any> {
    // 가장 최신의 점심조 설정 데이터 조회
    const lunchGroupConfig = await this.playgroupundModel.findLatestLunchGroupConfig();
    if (!lunchGroupConfig) {
      return [];
    }

    const { sDate, eDate, notice, maxGroup, _id: configId } = lunchGroupConfig;

    let groupToAssign: string | null = null;
    const groups: Record<string, string[]> = {};

    for (let i = 1; i <= maxGroup; i++) {
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

    return { sDate, eDate, notice, groups, groupToAssign };
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
    /* 설정 config을 생성한다. */
    const insertValue: BaverageConfig = { ...monthlyBaverage };
    const configId = await this.playgroupundModel.createMonthlyBaverageConfig(insertValue);

    /* 모든 직원에 대한 음료 주문 내역을 생성한다 */
    const userNames: string[] = await this.userRepository.getAllUserNames();
    const insertValues: BaverageMember[] = [];
    await Promise.all(
      userNames.map(async (userName) => {
        insertValues.push({
          configId,
          userName,
          baverage: 'NONE',
        });
      }),
    );

    await this.playgroupundModel.createBaverageMember(insertValues);

    return;
  }

  async getMonthlyBaverageForAdmin() {
    const config = await this.playgroupundModel.findLatestBaverageConfig();
    const countStats = await this.playgroupundModel.getBaverageCountStats(config._id);
    const details = await this.playgroupundModel.getBaverageDetails(config._id);
    const result = { config, countStats, details };

    return result;
  }
}
