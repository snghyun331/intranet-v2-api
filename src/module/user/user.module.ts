import { Module } from '@nestjs/common';
import { AdminUserController, UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entity/user/user.entity';
import { UserService } from './user.service';
import { UserRepository } from './repository/user.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, UserRepository],
  controllers: [UserController, AdminUserController],
})
export class UserModule {}
