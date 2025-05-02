import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repository/auth.repository';
import { JwtUserStrategy } from './strategy/jwtUser.strategy';
import { JwtModule } from '@nestjs/jwt';
import { JWT_CONFIG } from '@config/jwt.config';
import { PassportModule } from '@nestjs/passport';
import { JwtAdminStrategy } from './strategy/jwtAdmin.strategy';
import { AdminEntity } from '@entity/admin/admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AdminEntity]),
    JwtModule.registerAsync(JWT_CONFIG),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [AuthService, AuthRepository, JwtUserStrategy, JwtAdminStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
