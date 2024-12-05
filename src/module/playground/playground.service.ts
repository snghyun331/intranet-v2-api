import { BadRequestException, Injectable } from '@nestjs/common';
import { PlayGroundRepository } from './repository/playground.repository';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';

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
}
