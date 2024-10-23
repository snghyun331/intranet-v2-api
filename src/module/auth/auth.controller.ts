import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { LOGIN } from './swagger/auth.swagger';
import { LoginUserDto } from './dto/loginUser.dto';
import { AuthService } from './auth.service';
import { LoginUserResult } from './interface/result.interface';
import { ResponseInterface } from '../../common/interface/response.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiTags('AUTH')
  @ApiOperation(LOGIN.POST.API_OPERATION)
  @ApiBody(LOGIN.POST.API_BODY)
  @ApiOkResponse(LOGIN.POST.API_OK_RESPONSE)
  @ApiUnauthorizedResponse(LOGIN.POST.API_UNAUTHORIZED_RESPONSE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async userLogin(@Body() userLoginInfo: LoginUserDto): Promise<ResponseInterface> {
    const user: LoginUserResult = await this.authService.userLogin(userLoginInfo);

    const response: ResponseInterface = { message: '로그인 성공', data: user };

    return response;
  }
}
