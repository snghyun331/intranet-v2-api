import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USERS_GRADES_IDX, USERS_IDXS, USERS_MY } from './swagger/user.swagger';
import { UserService } from './user.service';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { ResponseInterface } from '../../common/interface/response.interface';
import { CurrentUserInfoResult, GradeIdxsResult, UserIdxsResult } from './interface/result.interface';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';

@ApiTags('사용자')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation(USERS_IDXS.GET.API_OPERATION)
  @ApiOkResponse(USERS_IDXS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('ids')
  async getAllUserIdxs(): Promise<ResponseInterface> {
    const userIdxInfo: UserIdxsResult[] = await this.userService.getAllUserIdxInfo();

    const response: ResponseInterface = { message: '모든 사용자 IDX 조회 성공', data: userIdxInfo };

    return response;
  }

  @ApiOperation(USERS_GRADES_IDX.GET.API_OPERATION)
  @ApiOkResponse(USERS_GRADES_IDX.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, AdminRoleGuard)
  @Get('gradeIds')
  async getAllGradeIdxs(): Promise<ResponseInterface> {
    const gradeIdxInfo: GradeIdxsResult[] = await this.userService.getAllGradeIdxInfo();

    const response: ResponseInterface = { message: '모든 직급 IDX 조회 성공', data: gradeIdxInfo };

    return response;
  }

  @ApiOperation(USERS_MY.GET.API_OPERATION)
  @ApiOkResponse(USERS_MY.GET.API_OK_RESPONSE)
  @ApiNotFoundResponse(USERS_MY.GET.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('me')
  async getMyInfo(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const user: CurrentUserInfoResult = await this.userService.getUserInfo(userIdx);

    const response: ResponseInterface = { message: '현재 로그인 되어있는 사용자 정보 조회 성공', data: user };

    return response;
  }
}
