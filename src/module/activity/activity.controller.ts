import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import {
  ADMIN_ACTIVITIES,
  ADMIN_ACTIVITIES_BALANCES,
  ADMIN_ACTIVITIES_BALANCES_CANCEL,
  ADMIN_ACTIVITIES_BUDGET,
  ADMIN_ACTIVITIES_BUDGET_NOTE,
  ADMIN_ACTIVITIES_CONFIRM,
  USERS_ACTIVITIES,
} from './swagger/activity.swagger';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { AdminRole, UserRole } from '../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../common/constant/enum';
import { CurrentUser, CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { CreateActivityDto } from './dto/createActivity.dto';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { ResponseInterface } from '../../common/interface/response.interface';
import {
  ActivityFilterDto,
  AdminActivityBalanceFilterDto,
  AdminActivityBudgetFilterDto,
  AdminActivityFilterDto,
} from './dto/query.dto';
import { UserPayload } from '../../common/interface/payload.interface';
import { ActivityBudgetAdminResult, ActivityResult } from './interface/result.interface';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { CreateActivityBudgetDto } from './dto/createBudget.dto';
import { UpdateBudgetDto } from './dto/updateBudget.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { UpdateConfirmDto } from './dto/updateConfirm.dto';
import { ActivityStatsAdminInfo } from './interface/activity.interface';

@ApiTags('사용자')
@Controller('users/activities')
export class UserActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation(USERS_ACTIVITIES.POST.API_OPERATION)
  @ApiBody(USERS_ACTIVITIES.POST.API_BODY)
  @ApiCreatedResponse(USERS_ACTIVITIES.POST.API_CREATED_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.POST.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Post()
  async createActivity(
    @Body() activityInfo: CreateActivityDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.createActivity(userIdx, activityInfo);

    const response: ResponseInterface = { message: '활동비 사용내역 저장 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.PUT.API_OPERATION)
  @ApiParam(USERS_ACTIVITIES.PUT.API_PARAM1)
  @ApiBody(USERS_ACTIVITIES.PUT.API_BODY)
  @ApiOkResponse(USERS_ACTIVITIES.PUT.API_OK_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.PUT.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiNotFoundResponse(USERS_ACTIVITIES.PUT.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Put(':activityIdx')
  async updateActivity(
    @Param('activityIdx', ParseIntPipe) activityIdx: number,
    @Body() activityInfo: UpdateActivityDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.updateActivity(userIdx, activityIdx, activityInfo);

    const response: ResponseInterface = { message: '활동비 사용내역 수정 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.DELETE.API_OPERATION)
  @ApiParam(USERS_ACTIVITIES.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_ACTIVITIES.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.DELETE.API_FORBIDDEN_RESPONSE)
  @ApiNotFoundResponse(USERS_ACTIVITIES.DELETE.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Delete(':activityIdx')
  async deleteActivity(
    @Param('activityIdx', ParseIntPipe) activityIdx: number,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.deleteActivity(userIdx, activityIdx);

    const response: ResponseInterface = { message: '활동비 사용내역 초기화 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.GET.API_OPERATION)
  @ApiOkResponse(USERS_ACTIVITIES.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getActivity(
    @Query() { year, halfYear }: ActivityFilterDto,
    @CurrentUser() user: UserPayload,
  ): Promise<ResponseInterface> {
    const activities: ActivityResult = await this.activityService.getActivity(year, halfYear, user);

    const response: ResponseInterface = { message: '활동비 사용내역 조회 성공', data: activities };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/activities')
export class AdminActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation(ADMIN_ACTIVITIES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_ACTIVITIES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getActivity(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminActivityFilterDto,
  ): Promise<ResponseInterface> {
    const { totalPage, total, activity } = await this.activityService.getAdminActivity(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data: { totalPage, total, activity } };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BUDGET.POST.API_OPERATION)
  @ApiBody(ADMIN_ACTIVITIES_BUDGET.POST.API_BODY)
  @ApiCreatedResponse(ADMIN_ACTIVITIES_BUDGET.POST.API_CREATED_RESPONSE)
  @ApiConflictResponse(ADMIN_ACTIVITIES_BUDGET.POST.API_CONFLICT_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('budget')
  async createActivityBudget(@Body() activityBudgetInfo: CreateActivityBudgetDto): Promise<ResponseInterface> {
    await this.activityService.createActivityBudget(activityBudgetInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BUDGET.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_ACTIVITIES_BUDGET.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('budget')
  async getActivityeBudget(@Query() filterInfo: AdminActivityBudgetFilterDto): Promise<ResponseInterface> {
    const activityBudget: ActivityBudgetAdminResult[] = await this.activityService.getActivityBudget(filterInfo);

    const response: ResponseInterface = { message: 'success', data: activityBudget };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BUDGET.PATCH.API_OPERATION)
  @ApiParam(ADMIN_ACTIVITIES_BUDGET.PATCH.API_PARAM1)
  @ApiBody(ADMIN_ACTIVITIES_BUDGET.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_ACTIVITIES_BUDGET.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('budget/:activityStatsIdx')
  async updateActivityBudget(
    @Param('activityStatsIdx', ParseIntPipe) activityStatsIdx: number,
    @Body() budgetInfo: UpdateBudgetDto,
  ): Promise<ResponseInterface> {
    await this.activityService.updateActivityBudget(activityStatsIdx, budgetInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BUDGET_NOTE.PATCH.API_OPERATION)
  @ApiParam(ADMIN_ACTIVITIES_BUDGET_NOTE.PATCH.API_PARAM1)
  @ApiBody(ADMIN_ACTIVITIES_BUDGET_NOTE.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_ACTIVITIES_BUDGET_NOTE.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_ACTIVITIES_BUDGET_NOTE.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('budget/:activityStatsIdx/note')
  async updateActivityStatsNote(
    @Param('activityStatsIdx', ParseIntPipe) activityStatsIdx: number,
    @Body() noteInfo: UpdateNoteDto,
  ): Promise<ResponseInterface> {
    await this.activityService.updateActivityStatsNote(activityStatsIdx, noteInfo);

    const response: ResponseInterface = { message: '비고 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_CONFIRM.PATCH.API_OPERATION)
  @ApiBody(ADMIN_ACTIVITIES_CONFIRM.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_ACTIVITIES_CONFIRM.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('confirm')
  async updateConfirmActivity(@Body() { activityIdxList, confirmYN }: UpdateConfirmDto): Promise<ResponseInterface> {
    await this.activityService.updateConfirmActivity(activityIdxList, confirmYN);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BALANCES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_ACTIVITIES_BALANCES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('balances')
  async getActivityBalance(@Query() filterInfo: AdminActivityBalanceFilterDto): Promise<ResponseInterface> {
    const activityStats: ActivityStatsAdminInfo[] = await this.activityService.getUserActivityStats(filterInfo);

    const response: ResponseInterface = {
      message: 'success',
      data: { ...filterInfo, activityStats },
    };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BALANCES.PATCH.API_OPERATION)
  @ApiBody(ADMIN_ACTIVITIES_BALANCES.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_ACTIVITIES_BALANCES.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_ACTIVITIES_BALANCES.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('balances')
  async updateClearStatusComplete(
    @Body('activityStatsIdxList') activityStatsIdxList: number[],
  ): Promise<ResponseInterface> {
    await this.activityService.updateClearStatusComplete(activityStatsIdxList);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_ACTIVITIES_BALANCES_CANCEL.PATCH.API_OPERATION)
  @ApiBody(ADMIN_ACTIVITIES_BALANCES_CANCEL.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_ACTIVITIES_BALANCES_CANCEL.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_ACTIVITIES_BALANCES_CANCEL.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('balances/cancel')
  async updateClearStatusNotYet(
    @Body('activityStatsIdxList') activityStatsIdxList: number[],
  ): Promise<ResponseInterface> {
    await this.activityService.updateClearStatusNotYet(activityStatsIdxList);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
