import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';
import { GradeEntity } from '../../entity/user/grade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GradeEntity])],
  providers: [UserService, UserRepository],
  controllers: [UserController],
})
export class UserModule {}
