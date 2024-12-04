import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private redis: Redis) {}

  async setLock(key: string, lockDuration: number): Promise<string> {
    const value = 'LOCK';
    const lock: string = await this.redis.set(key, value, 'EX', lockDuration, 'NX');
    return lock;
  }

  async getLock(key: string): Promise<number> {
    const remainSeconds: number = await this.redis.ttl(key);

    return remainSeconds;
  }

  async delLock(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
