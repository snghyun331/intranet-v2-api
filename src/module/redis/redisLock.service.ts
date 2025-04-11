import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService {
  constructor(@InjectRedis() private redis: Redis) {}

  /* Lock을 습득하는 함수 */
  async setLock(key: string, ttl: number): Promise<string> {
    const lock: string = await this.redis.set(key, 'LOCK', 'EX', ttl, 'NX');

    return lock;
  }

  /* Lock을 습득할 때까지 대기하는 함수 */
  async waitAndSetLock(key: string, ttl: number, maxWaitMs = 3000, retryDelayMs = 200): Promise<boolean> {
    // LOCK 습득을 처음 시도한 시간
    const startTime: number = Date.now();

    // 최대 대기 시간(maxWaitMs)을 넘지 않는 동안에만 반복
    while (Date.now() - startTime < maxWaitMs) {
      const result = await this.setLock(key, ttl);

      if (result === 'OK') {
        return true; // LOCK 획득 성공
      }

      // LOCK 획득 실패 시, 잠깐 대기 후 재시도
      await new Promise((res) => setTimeout(res, retryDelayMs));
    }

    // maxWaitMs 동안 LOCK 못 얻음
    return false;
  }

  /* Lock의 TLL 정보를 반환하는 함수 */
  async getLockTTL(key: string): Promise<number> {
    const remainSeconds: number = await this.redis.ttl(key);

    return remainSeconds;
  }

  /* Lock을 종료하는 함수 */
  async delLock(key: string): Promise<void> {
    await this.redis.del(key);

    return;
  }
}
