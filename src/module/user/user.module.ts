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

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GradeEntity, HeadquarterEntity, TeamEntity, AdminEntity])],
  providers: [UserService, UserRepository],
  controllers: [UserController, AdminUserController],
})
export class UserModule {}
