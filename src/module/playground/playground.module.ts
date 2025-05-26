import { Logger, Module } from '@nestjs/common';
import { AdminPlaygroundController, UserPlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigSchema } from '@schema/lunchGroup/lunchGroupConfig.schema';
import { LunchGroupMember, LunchGroupMemberSchema } from '@schema/lunchGroup/lunchGroupMember.schema';
import { PlayGroundModel } from './model/playground.model';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisLockService } from '@redis/redisLock.service';
import { BaverageConfig, BaverageConfigSchema } from '../../schema/baverage/baverageConfig.schema';
import { BaverageMember, BaverageMemberSchema } from '../../schema/baverage/baverageMember.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MongooseModule.forFeature([
      { name: LunchGroupConfig.name, schema: LunchGroupConfigSchema },
      { name: LunchGroupMember.name, schema: LunchGroupMemberSchema },
      { name: BaverageConfig.name, schema: BaverageConfigSchema },
      { name: BaverageMember.name, schema: BaverageMemberSchema },
    ]),
    RedisModule,
  ],
  providers: [PlaygroundService, RedisLockService, PlayGroundModel, Logger],
  controllers: [UserPlaygroundController, AdminPlaygroundController],
  exports: [PlayGroundModel],
})
export class PlaygroundModule {}
