import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthRepository } from './repository/auth.repository';
import { JwtService } from '@nestjs/jwt';
import { LoginAdminResult, LoginUserResult } from './interface/result.interface';
import { User } from './interface/user.interface';
import { decryptPassword } from '../../common/utils/utility';
import { Admin } from './interface/admin.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async userLogin(loginInfo: LoginDto): Promise<LoginUserResult> {
    const user: User = await this.authRepository.getUserPersonal(loginInfo.id);
    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
    const decryptedUserPW: string = decryptPassword(user.password);
    if (user && loginInfo.password === decryptedUserPW) {
      const { id, password, ...payload } = user;
      const accessToken: string = this.jwtService.sign(payload);

      await this.authRepository.updateAdminToken(id, accessToken);

      return { accessToken, ...payload };
    } else {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  }

  async userLogout(userIdx: number): Promise<void> {
    const userCnt: number = await this.authRepository.getUserCountByIdx(userIdx);
    if (userCnt !== 1) {
      throw new BadRequestException('올바른 유저가 아닙니다.');
    }

    await this.authRepository.deleteUserToken(userIdx);

    return;
  }

  async adminLogin(adminLoginInfo: LoginDto): Promise<LoginAdminResult> {
    const admin: Admin = await this.authRepository.getAdminPersonal(adminLoginInfo.id);
    if (!admin) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
    const decryptedUserPW: string = decryptPassword(admin.password);
    if (admin && adminLoginInfo.password === decryptedUserPW) {
      const { id, password, ...payload } = admin;
      const accessToken: string = this.jwtService.sign(payload);

      await this.authRepository.updateUserToken(id, accessToken);

      return { accessToken, ...payload };
    } else {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  }
}
