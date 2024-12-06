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
    // const userCnt: number = await this.playgroundRepository.getUserCountByName(userName);
    // if (userCnt !== 1) {
    //   throw new BadRequestException('올바르지 않은 유저 이름입니다.');
    // }
    const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    if (!lunchGroupInfo) {
      throw new BadRequestException('지금은 뽑기 가능 시간이 아닙니다.');
    }
    const total = Number(lunchGroupInfo.total);
    const maxGroup: number = Number(lunchGroupInfo.maxGroup);
    const perGroup: number = Number(lunchGroupInfo.perGroup);
    // const extraGroupCapacities: number = Number(lunchGroupInfo.extraGroupCapacities);

    const extraGroupCount = total % perGroup === 0 ? 0 : total % perGroup;

    // 그룹 배치: 총 그룹 수 중 초과 그룹은 extraGroupCount만큼만 존재하고 나머지는 기본 그룹
    let groupToAssign: number | null = null;

    // 그룹 배정 시작 (랜덤)
    while (true) {
      const group = Math.floor(Math.random() * maxGroup) + 1;
      const groupKey = `lunch-group:${group}`;
      const groupSize = await this.redis.scard(groupKey);

      // 기본 그룹
      if (groupSize < perGroup && groupToAssign === null) {
        groupToAssign = group;
        break;
      }

      // 초과 인원 그룹 (남는 인원만큼)
      if (groupSize < perGroup + 1 && extraGroupCount > 0) {
        groupToAssign = group;
        break;
      }
    }

    // 랜덤으로 뽑힌 그룹에 사용자 추가
    await this.redis.sadd(`lunch-group:${groupToAssign}`, userName);

    return groupToAssign;
  }

  async setLunchGroup({ total, perGroup, sDate, eDate }: CreateLunchGroupDto): Promise<void> {
    const kstEDate: Date = new Date(`${eDate}T23:59:59+09:00`);
    const ttlSeconds: number = Math.floor((kstEDate.getTime() - Date.now()) / 1000);
    const maxGroup: number = Math.floor(total / perGroup);
    const extraGroupCapacities: number = total % perGroup ? perGroup + 1 : 0;
    await this.redis.hmset(
      'lunch-group',
      'total',
      total,
      'maxGroup',
      maxGroup,
      'perGroup',
      perGroup,
      'extraGroupCapacities',
      extraGroupCapacities,
      'sDate',
      sDate,
      'eDate',
      eDate,
    );
    await this.redis.expire('lunch-group', ttlSeconds);

    for (let i = 1; i < maxGroup + 1; i++) {
      await this.redis.sadd(`lunch-group:${i}`, '');
      await this.redis.srem(`lunch-group:${i}`, '');
      await this.redis.expire(`lunch-group:${i}`, ttlSeconds);
    }

    return;
  }

  async getLunchGroup(): Promise<any> {
    const lunchGroupInfo = await this.redis.hgetall('lunch-group');
    if (!lunchGroupInfo) {
      return [];
    }
    const maxGroup: number = Number(lunchGroupInfo.maxGroup);
    const keys: string[] = await this.redis.keys('lunch-group:*');

    const groups = {};
    for (let i = 1; i <= maxGroup; i++) {
      groups[i.toString()] = [];
    }
    for (const key of keys) {
      const groupNo: string = key.replace('lunch-group:', '');
      const users = await this.redis.smembers(key);
      groups[groupNo] = users;
    }

    return { groups };
  }
}
