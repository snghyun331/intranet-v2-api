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
    const userCnt: number = await this.playgroundRepository.getUserCountByName(userName);
    if (userCnt !== 1) {
      throw new BadRequestException('올바르지 않은 유저 이름입니다.');
    }
    // 랜덤 조 생성
    const group: number = Math.floor(Math.random() * 10) + 1;
    // Redis에 사용자 추가
    await this.redis.sadd(`lunch-group:${group}`, userName);

    return group;
  }

  async setLunchGroup({ total, perGroup, sDate, eDate }: CreateLunchGroupDto): Promise<void> {
    const kstEDate: Date = new Date(`${eDate}T23:59:59+09:00`);
    const ttlSeconds: number = Math.floor((kstEDate.getTime() - Date.now()) / 1000);
    const maxGroup: number = Math.floor(total / perGroup);
    await this.redis.hmset('lunch-group', 'maxGroup', maxGroup, 'sDate', sDate, 'eDate', eDate);
    await this.redis.expire('lunch-group', ttlSeconds);

    for (let i = 1; i < maxGroup + 1; i++) {
      await this.redis.set(`lunch-group:${i}`, '', 'EX', ttlSeconds, 'NX');
    }

    return;
  }
}
