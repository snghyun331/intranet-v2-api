import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { CreateLunchGroupDto } from './dto/createLunchGroup.dto';
import { PlayGroundModel } from './model/playground.model';
import { SetLunchGroup } from './interface/lunchGroup.interface';
import * as moment from 'moment';
import mongoose from 'mongoose';

@Injectable()
export class PlaygroundService {
  constructor(
    private readonly playgroupundModel: PlayGroundModel,
    @Inject(Logger) private readonly logger: LoggerService,
  ) {}

  async pickLunchGroup(userName: string): Promise<number> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
      // 유효한 점심조 설정 찾기 (마감일이 지나지 않은 점심조)
      const lunchGroupConfig = await this.playgroupundModel.findAvailableLunchGroupConfig(nowDate);
      if (!lunchGroupConfig) {
        throw new BadRequestException('지금은 뽑기 가능 시간이 아닙니다.');
      }
      const { _id: configId, maxGroup, perGroup, extraGroupCount } = lunchGroupConfig;
      // 이미 배정되었는지 확인
      const isExistingAssignment = await this.playgroupundModel.checkUserAssignedToLunchGroup(configId, userName);
      if (isExistingAssignment) {
        throw new BadRequestException('이미 조에 배정되었습니다.');
      }
      // 모든 그룹의 현재 멤버 수 조회
      const groupCounts = await this.playgroupundModel.getUserCountByLunchGroup(configId);

      // 그룹별 멤버 수를 객체로 변환
      const groupSizeMap = new Map<number, number>();
      groupCounts.forEach((group) => groupSizeMap.set(group._id, group.count));

      // 랜덤 그룹 배정 시작
      let groupToAssign: number | null = null;
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
      await this.playgroupundModel.addUserInLunchGroup(configId, groupToAssign, userName, session);

      return groupToAssign;
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(err);
    } finally {
      session.endSession();
    }
  }

  async setLunchGroup({ total, perGroup, sDate, eDate, notice }: CreateLunchGroupDto): Promise<void> {
    // 이미 설정한 데이터가 있는지 확인
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    const existLunchGroupConfig = await this.playgroupundModel.findAvailableLunchGroupConfig(nowDate);
    if (existLunchGroupConfig) {
      throw new BadRequestException('기존 점심조 설정이 남아있습니다. 삭제 후 다시 시도해주세요.');
    }

    const maxGroup: number = Math.floor(total / perGroup);
    const extraGroupCount: number = total % perGroup === 0 ? 0 : total % perGroup;
    const insertValue: SetLunchGroup = {
      total,
      perGroup,
      maxGroup,
      extraGroupCount,
      sDate,
      eDate,
      notice,
    };
    await this.playgroupundModel.createLunchGroupConfig(insertValue);

    return;
  }

  async getLunchGroupForAdmin(): Promise<any> {
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    // 유효한 점심조 설정 찾기 (마감일이 지나지 않은 점심조)
    const lunchGroupConfig = await this.playgroupundModel.findAvailableLunchGroupConfig(nowDate);
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
    const nowDate: string = moment().utcOffset(9).format('YYYY-MM-DD');
    // 유효한 점심조 설정 찾기 (마감일이 지나지 않은 점심조)
    const lunchGroupConfig = await this.playgroupundModel.findAvailableLunchGroupConfig(nowDate);
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
}
