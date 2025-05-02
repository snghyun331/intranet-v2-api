import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { SearchUserDto } from '@user/dto/searchUser.dto';

@Injectable()
export class RedisSearchService {
  private readonly zsetKey = 'prefix:users';

  constructor(@InjectRedis() private redis: Redis) {}

  /* 유저네임을 prefix단위로 분해해 Redis ZSET에 저장 */
  async addUserInRedis(userIdx: number, userName: string): Promise<void> {
    const multi = this.redis.multi(); // 여러 zadd 명령어를 한꺼번에 보냄 (트랜잭션 처리)

    for (let i = 1; i <= userName.length; i++) {
      const prefix: string = userName.slice(0, i);
      const value: string = `${prefix}:${userName}:${userIdx}`;
      multi.zadd(this.zsetKey, 0, value); // score: 0 (자동정렬X)
    }

    await multi.exec();
  }

  async removeUserInRedis(userIdx: number, userName: string): Promise<void> {
    const multi = this.redis.multi();

    for (let i = 1; i <= userName.length; i++) {
      const prefix: string = userName.slice(0, i);
      const value: string = `${prefix}:${userName}:${userIdx}`;
      multi.zrem(this.zsetKey, value);
    }

    await multi.exec();
  }

  /* prefix로 유저네임 자동완성 검색 */
  async getUserNameByPrefix(prefix: string): Promise<SearchUserDto[]> {
    const min: string = `[${prefix}`; // prefix로 시작하는 문자열 포함
    const max: string = `[${prefix}\xff`; // 해당 prefix로 시작하는 모든 ZSET항목을 가져옴

    const results: string[] = await this.redis.zrangebylex(this.zsetKey, min, max); // 사전순 정렬된 문자열 범위 검색

    const seen = new Set(); // Set을 사용해 유저네임 중복되지 않도록 필터링
    const users: SearchUserDto[] = [];

    for (const entry of results) {
      const [, userName, userIdx] = entry.split(':');

      if (!seen.has(userName)) {
        seen.add(userName);
        users.push({ userName, userIdx: Number(userIdx) });
      }
    }

    return users;
  }
}
