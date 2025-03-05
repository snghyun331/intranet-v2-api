import { Module } from '@nestjs/common';
import { AdminPlaygroundController, UserPlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { PlayGroundRepository } from './repository/playground.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { RedisModule } from '@nestjs-modules/ioredis';
import { MongooseModule } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigSchema } from '../../schema/lunchGroup/lunchGroupConfig.schema';
import { LunchGroupMember, LunchGroupMemberSchema } from '../../schema/lunchGroup/lunchGroupMember.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MongooseModule.forFeature([
      { name: LunchGroupConfig.name, schema: LunchGroupConfigSchema },
      { name: LunchGroupMember.name, schema: LunchGroupMemberSchema },
    ]),
    RedisModule,
  ],
  providers: [PlaygroundService, PlayGroundRepository],
  controllers: [UserPlaygroundController, AdminPlaygroundController],
})
export class PlaygroundModule {}
