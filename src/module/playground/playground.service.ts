import { BadRequestException, Injectable } from '@nestjs/common';
import { PlayGroundRepository } from './repository/playground.repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { CreateLunchGroupDto } from './dto/createLunchGroup.dto';

@Injectable()
export class PlaygroundService {
  constructor(
    private readonly playgroundRepository: PlayGroundRepository,
    @InjectRedis() private redis: Redis,
  ) {}

  async pickLunchGroup(userName: string): Promise<number> {
    const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    if (Object.keys(lunchGroupInfo).length === 0) {
      throw new BadRequestException('지금은 뽑기 가능 시간이 아닙니다.');
    }
    const maxGroup: number = Number(lunchGroupInfo.maxGroup);
    const perGroup: number = Number(lunchGroupInfo.perGroup);
    const extraGroupCount = Number(lunchGroupInfo.extraGroupCount);
    // 모든 그룹의 유저 확인
    const allGroupKeys = await this.redis.keys('lunch-group:*');
    await Promise.all(
      allGroupKeys.map(async (key: string) => {
        const users: string[] = await this.redis.smembers(key);
        if (users.includes(userName)) {
          throw new BadRequestException(`이미 조에 배정되었습니다.`);
        }
      }),
    );
    // 그룹 배치: 총 그룹 수 중 초과 그룹은 extraGroupCount만큼만 존재하고 나머지는 기본 그룹
    let groupToAssign: number | null = null;
    // 그룹 배정 시작 (랜덤)
    while (true) {
      const groupNo: number = Math.floor(Math.random() * maxGroup) + 1;
      const groupKey: string = `lunch-group:${groupNo}`;
      const groupSize: number = await this.redis.scard(groupKey);
      // 기본 그룹
      if (groupSize < perGroup && groupToAssign === null) {
        groupToAssign = groupNo;
        break;
      }
      // 초과 인원 그룹 (남는 인원만큼)
      if (groupSize < perGroup + 1 && extraGroupCount > 0) {
        groupToAssign = groupNo;
        break;
      }
    }
    // 랜덤으로 뽑힌 그룹에 사용자 추가
    await this.redis.sadd(`lunch-group:${groupToAssign}`, userName);

    return groupToAssign;
  }

  async setLunchGroup({ total, perGroup, sDate, eDate, notice }: CreateLunchGroupDto): Promise<void> {
    // // 아직 기존 key가 존재하면 예외처리
    // const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    // if (Object.keys(lunchGroupInfo).length !== 0) {
    //   throw new BadRequestException('점심조 만료 시간이 지나지 않아 새로 생성할 수 없습니다.');
    // }

    const kstEDate: Date = new Date(`${eDate}T23:59:59+09:00`);
    const ttlSeconds: number = Math.floor((kstEDate.getTime() - Date.now()) / 1000);
    const maxGroup: number = Math.floor(total / perGroup);
    const extraGroupCount: number = total % perGroup === 0 ? 0 : total % perGroup;
    await this.redis.hmset(
      'lunch-group',
      'total',
      total,
      'maxGroup',
      maxGroup,
      'perGroup',
      perGroup,
      'extraGroupCount',
      extraGroupCount,
      'sDate',
      sDate,
      'eDate',
      eDate,
      'notice',
      notice,
    );
    await this.redis.expire('lunch-group', ttlSeconds);

    for (let i = 1; i < maxGroup + 1; i++) {
      await this.redis.sadd(`lunch-group:${i}`, '');
      await this.redis.expire(`lunch-group:${i}`, ttlSeconds);
    }

    return;
  }

  async getLunchGroupForAdmin(): Promise<any> {
    const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    if (Object.keys(lunchGroupInfo).length === 0) {
      return [];
    }
    const maxGroup: number = Number(lunchGroupInfo.maxGroup);
    const keys: string[] = await this.redis.keys('lunch-group:*');

    const { sDate, eDate, total, perGroup, notice } = lunchGroupInfo;

    const groups = {};
    for (let i = 1; i <= maxGroup; i++) {
      groups[i.toString()] = [];
    }
    for (const key of keys) {
      const groupNo: string = key.replace('lunch-group:', '');
      const users = await this.redis.smembers(key);
      const filterdUsers: string[] = users.filter((user: string) => user !== '');
      groups[groupNo] = filterdUsers;
    }

    return { sDate, eDate, total, perGroup, notice, groups };
  }

  async getLunchGroupForUser(userName: string): Promise<any> {
    const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    if (Object.keys(lunchGroupInfo).length === 0) {
      return [];
    }
    const maxGroup: number = Number(lunchGroupInfo.maxGroup);
    const keys: string[] = await this.redis.keys('lunch-group:*');

    const { sDate, eDate, notice } = lunchGroupInfo;

    let groupToAssign: string | null = null;
    const groups = {};

    for (let i = 1; i <= maxGroup; i++) {
      groups[i.toString()] = [];
    }
    for (const key of keys) {
      const groupNo: string = key.replace('lunch-group:', '');
      const users = await this.redis.smembers(key);
      const filterdUsers: string[] = users.filter((user: string) => user !== '');
      if (filterdUsers.includes(userName)) {
        groupToAssign = groupNo;
      }
      groups[groupNo] = filterdUsers;
    }

    return { sDate, eDate, notice, groups, groupToAssign };
  }
}
