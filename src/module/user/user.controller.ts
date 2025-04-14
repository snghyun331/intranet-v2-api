import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  USERS_GRADES_IDX,
  ADMIN_USERS,
  USERS_IDXS,
  USERS_MY,
  ADMIN_USERS_CHECK,
  USERS_MY_PW,
  USERS_HQ_IDX,
  USERS_TEAM_IDX,
  ADMIN_USERS_IDXS,
  USERS_BIRTH,
  ADMIN_SEARCH_PREFIX_USERNAME,
} from './swagger/user.swagger';
import { UserService } from './user.service';
import { AdminRole, UserRole } from '../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { ResponseInterface } from '../../common/interface/response.interface';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
  HqIdxsResult,
  TeamIdxsResult,
} from './interface/result.interface';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from './dto/query.dto';
import { CreateUserDto } from './dto/createUser.dto';
import { UpdateMyInfoDto } from './dto/updateMyInfo.dto';
import { UpdateMyPwDto } from './dto/updateMyPw.dto';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { UpdateUserDto } from './dto/updateUser.dto';
import { UserDto } from './interface/user.interface';

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
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('gradeIds')
  async getAllGradeIdxs(): Promise<ResponseInterface> {
    const gradeIdxInfo: GradeIdxsResult[] = await this.userService.getAllGradeIdxInfo();

    const response: ResponseInterface = { message: '모든 직급 IDX 조회 성공', data: gradeIdxInfo };

    return response;
  }

  @ApiOperation(USERS_HQ_IDX.GET.API_OPERATION)
  @ApiOkResponse(USERS_HQ_IDX.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('hqIds')
  async getAllHqIdxs(): Promise<ResponseInterface> {
    const hqIdxInfo: HqIdxsResult[] = await this.userService.getAllHqIdxInfo();

    const response: ResponseInterface = { message: '모든 본부 IDX 조회 성공', data: hqIdxInfo };

    return response;
  }

  @ApiOperation(USERS_TEAM_IDX.GET.API_OPERATION)
  @ApiOkResponse(USERS_TEAM_IDX.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('teamIds')
  async getAllTeamIdxs(): Promise<ResponseInterface> {
    const teamIdxInfo: TeamIdxsResult[] = await this.userService.getAllTeamIdxInfo();

    const response: ResponseInterface = { message: '모든 팀 IDX 조회 성공', data: teamIdxInfo };

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
    const user: CurrentUserInfoResult = await this.userService.getMyInfo(userIdx);

    const response: ResponseInterface = { message: '현재 로그인 되어있는 사용자 정보 조회 성공', data: user };

    return response;
  }

  @ApiOperation(USERS_MY.PUT.API_OPERATION)
  @ApiBody(USERS_MY.PUT.API_BODY)
  @ApiOkResponse(USERS_MY.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Put('me')
  async updateMyInfo(
    @CurrentUserIdx() userIdx: number,
    @Body() updateInfo: UpdateMyInfoDto,
  ): Promise<ResponseInterface> {
    await this.userService.updateMyInfo(userIdx, updateInfo);

    const response: ResponseInterface = { message: '내 기본 정보 수정 성공' };

    return response;
  }

  @ApiOperation(USERS_MY_PW.PATCH.API_OPERATION)
  @ApiOkResponse(USERS_MY_PW.PATCH.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MY_PW.PATCH.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Patch('me/password')
  async updateMyPw(@CurrentUserIdx() userIdx: number, @Body() updateInfo: UpdateMyPwDto): Promise<ResponseInterface> {
    await this.userService.updateMyPassword(userIdx, updateInfo);

    const response: ResponseInterface = { message: '내 비밀번호 변경 성공' };

    return response;
  }

  @ApiOperation(USERS_BIRTH.GET.API_OPERATION)
  @ApiQuery(USERS_BIRTH.GET.API_QUERY1)
  @ApiOkResponse(USERS_BIRTH.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('birth')
  async getBirthdayUsers(@Query('month') month: string): Promise<ResponseInterface> {
    const birthdayUsers = await this.userService.getBirthdayUsers(month);

    const response: ResponseInterface = { message: 'success', data: birthdayUsers };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation(ADMIN_USERS.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_USERS.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_USERS.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getAllUsersInfo(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminUserFilterDto,
  ): Promise<ResponseInterface> {
    const { totalPage, total, users }: AllUserInfoResult = await this.userService.getAllUsersInfo(
      pageNoInfo,
      filterInfo,
    );

    const response: ResponseInterface = { message: '모든 직원 정보 조회 성공', data: { totalPage, total, users } };

    return response;
  }

  @ApiOperation(ADMIN_USERS.POST.API_OPERATION)
  @ApiBody(ADMIN_USERS.POST.API_BODY)
  @ApiCreatedResponse(ADMIN_USERS.POST.API_CREATED_RESPONSE)
  @ApiConflictResponse(ADMIN_USERS.POST.API_CONFLICT_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post()
  async createUser(@Body() newUserInfo: CreateUserDto): Promise<ResponseInterface> {
    await this.userService.createUser(newUserInfo);

    const response: ResponseInterface = { message: '새로운 유저 등록 성공' };

    return response;
  }

  @ApiOperation(ADMIN_USERS_CHECK.GET.API_OPERATION)
  @ApiParam(ADMIN_USERS_CHECK.GET.API_PARAM1)
  @ApiOkResponse(ADMIN_USERS_CHECK.GET.API_OK_RESPONSE)
  @ApiConflictResponse(ADMIN_USERS_CHECK.GET.API_CONFLICT_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('check-login-id/:loginId')
  async checkLoginId(@Param('loginId') loginId: string): Promise<ResponseInterface> {
    const id: string = await this.userService.checkIdIfAvailable(loginId);

    const response: ResponseInterface = { message: '아이디 중복확인 성공', data: { id } };

    return response;
  }

  @ApiOperation(ADMIN_USERS.PUT.API_OPERATION)
  @ApiParam(ADMIN_USERS.PUT.API_PARAM1)
  @ApiBody(ADMIN_USERS.PUT.API_BODY)
  @ApiOkResponse(ADMIN_USERS.PUT.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_USERS.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Put(':userIdx')
  async updateUser(
    @Param('userIdx', ParseIntPipe) userIdx: number,
    @Body() updateInfo: UpdateUserDto,
  ): Promise<ResponseInterface> {
    await this.userService.updateUser(userIdx, updateInfo);

    const response: ResponseInterface = { message: '유저 정보 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_USERS.DELETE.API_OPERATION)
  @ApiParam(ADMIN_USERS.DELETE.API_PARAM1)
  @ApiOkResponse(ADMIN_USERS.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_USERS.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Delete(':userIdx')
  async deleteUser(@Param('userIdx', ParseIntPipe) userIdx: number): Promise<ResponseInterface> {
    await this.userService.deleteUser(userIdx);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_USERS_IDXS.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_USERS_IDXS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('ids')
  async getAllUserIdxs(): Promise<ResponseInterface> {
    const userIdxInfo: UserIdxsResult[] = await this.userService.getAllUserIdxInfo();

    const response: ResponseInterface = { message: '모든 사용자 IDX 조회 성공', data: userIdxInfo };

    return response;
  }

  @ApiOperation(ADMIN_SEARCH_PREFIX_USERNAME.GET.API_OPERATION)
  @ApiQuery(ADMIN_SEARCH_PREFIX_USERNAME.GET.API_QUERY1)
  @ApiOkResponse(ADMIN_SEARCH_PREFIX_USERNAME.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('search-prefix/username')
  async getAllUserName(@Query('searchWord') searchWord: string): Promise<ResponseInterface> {
    const data = await this.userService.getAllUserName(searchWord);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_SEARCH_PREFIX_USERNAME.POST.API_OPERATION)
  @ApiBody(ADMIN_SEARCH_PREFIX_USERNAME.POST.API_BODY)
  @Post('search-prefix/username')
  async test(@Body() user: UserDto): Promise<ResponseInterface> {
    await this.userService.addUserInRedis(user);

    const response: ResponseInterface = { message: 'success', data: user };
    return response;
  }
}
