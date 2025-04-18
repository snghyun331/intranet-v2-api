import { Module } from '@nestjs/common';
import { AdminUserController, UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';
import { GradeEntity } from '../../entity/user/grade.entity';
import { HeadquarterEntity } from '../../entity/user/headquarter.entity';
import { TeamEntity } from '../../entity/user/team.entity';
import { AdminEntity } from '../../entity/admin/admin.entity';
import { CommuteEntity } from '../../entity/intranet/commute/commute.entity';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisSearchService } from '../redis/redisSearch.service';
import { MockUserService } from './mock/user.service.mock';
import { MockAdminUserController } from './mock/user.controller.mock';
import { CommuteRepository } from '../intranet/commute/repository/commute.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, GradeEntity, HeadquarterEntity, TeamEntity, AdminEntity, CommuteEntity]),
    RedisModule,
  ],
  providers: [UserService, UserRepository, RedisSearchService, CommuteRepository],
  controllers: [UserController, AdminUserController],
})
export class UserModule {}

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, GradeEntity, HeadquarterEntity, TeamEntity, AdminEntity, CommuteEntity]),
  ],
  providers: [MockUserService, UserRepository],
  controllers: [MockAdminUserController],
})
export class MockUserModule {}
