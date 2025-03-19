import { Logger, Module } from '@nestjs/common';
import { AdminPlaygroundController, UserPlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigSchema } from '../../schema/lunchGroup/lunchGroupConfig.schema';
import { LunchGroupMember, LunchGroupMemberSchema } from '../../schema/lunchGroup/lunchGroupMember.schema';
import { PlayGroundModel } from './model/playground.model';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    MongooseModule.forFeature([
      { name: LunchGroupConfig.name, schema: LunchGroupConfigSchema },
      { name: LunchGroupMember.name, schema: LunchGroupMemberSchema },
    ]),
  ],
  providers: [PlaygroundService, PlayGroundModel, Logger],
  controllers: [UserPlaygroundController, AdminPlaygroundController],
})
export class PlaygroundModule {}
