import { Module } from '@nestjs/common';
import { AdminPlaygroundController, UserPlaygroundController } from './playground.controller';
import { PlaygroundService } from './playground.service';
import { PlayGroundRepository } from './repository/playground.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), RedisModule],
  providers: [PlaygroundService, PlayGroundRepository],
  controllers: [UserPlaygroundController, AdminPlaygroundController],
})
export class PlaygroundModule {}
