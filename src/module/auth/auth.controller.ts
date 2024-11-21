import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LOGIN, LOGIN_ADMIN, LOGOUT } from './swagger/auth.swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { LoginAdminResult, LoginUserResult } from './interface/result.interface';
import { ResponseInterface } from '../../common/interface/response.interface';
import { UserRole } from '../../common/decorator/role.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from './guard/authGuard/userAuth.guard';
import { UserRoleGuard } from './guard/roleGuard/userRole.guard';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';

@ApiTags('AUTH')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation(LOGIN.POST.API_OPERATION)
  @ApiBody(LOGIN.POST.API_BODY)
  @ApiOkResponse(LOGIN.POST.API_OK_RESPONSE)
  @ApiUnauthorizedResponse(LOGIN.POST.API_UNAUTHORIZED_RESPONSE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async userLogin(@Body() loginInfo: LoginDto): Promise<ResponseInterface> {
    const user: LoginUserResult = await this.authService.userLogin(loginInfo);

    const response: ResponseInterface = { message: '로그인 성공', data: user };

    return response;
  }

  @ApiOperation(LOGOUT.POST.API_OPERATION)
  @ApiOkResponse(LOGOUT.POST.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async userLogout(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    await this.authService.userLogout(userIdx);

    const response: ResponseInterface = { message: '로그아웃 성공', data: { userIdx } };

    return response;
  }

  @ApiOperation(LOGIN_ADMIN.POST.API_OPERATION)
  @ApiBody(LOGIN_ADMIN.POST.API_BODY)
  @ApiOkResponse(LOGIN_ADMIN.POST.API_OK_RESPONSE)
  @ApiUnauthorizedResponse(LOGIN_ADMIN.POST.API_UNAUTHORIZED_RESPONSE)
  @HttpCode(HttpStatus.OK)
  @Post('login/admin')
  async adminLogin(@Body() loginInfo: LoginDto): Promise<ResponseInterface> {
    const admin: LoginAdminResult = await this.authService.adminLogin(loginInfo);

    const response: ResponseInterface = { message: '로그인 성공', data: admin };

    return response;
  }
}
