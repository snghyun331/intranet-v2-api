import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto, LoginUserResultDto } from './dto/loginUser.dto';
import { AuthRepository } from './repository/auth.repository';
import { UserDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private jwtService: JwtService,
  ) {}

  async userLogin(userLoginInfo: LoginUserDto): Promise<LoginUserResultDto> {
    const user: UserDto = await this.authRepository.getUserPersonal(userLoginInfo.id);
    if (user && userLoginInfo.password === user.password) {
      const { id, password, ...payload } = user;
      const accessToken: string = this.jwtService.sign(payload);
      return { accessToken, ...payload };
    } else {
      throw new UnauthorizedException('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  }
}
