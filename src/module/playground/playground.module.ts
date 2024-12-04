import { Module } from '@nestjs/common';
import { PlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [PlaygroundService, RedisService],
  controllers: [PlaygroundController],
})
export class PlaygroundModule {}
