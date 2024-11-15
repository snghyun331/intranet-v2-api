import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { USERS_GRADES_IDX, ADMIN_USERS, USERS_IDXS, USERS_MY } from './swagger/user.swagger';
import { UserService } from './user.service';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { ResponseInterface } from '../../common/interface/response.interface';
import {
  CurrentUserInfoResult,
  GradeIdxsResult,
  UserIdxsResult,
  AllUserInfoResult,
} from './interface/result.interface';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from './dto/query.dto';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CreateUserDto } from './dto/createUser.dto';

@ApiTags('사용자(USER)')
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

@ApiTags('사용자 관리(ADMIN)')
@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation(ADMIN_USERS.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_USERS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, AdminRoleGuard)
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
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, AdminRoleGuard)
  @Post()
  async createUser(
    @Body() newUserInfo: CreateUserDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.userService.createUser(newUserInfo, manager);

    const response: ResponseInterface = { message: '새로운 유저 등록 성공' };

    return response;
  }
}
