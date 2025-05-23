import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ADMIN_PLAYGROUND_LUNCH_GROUP,
  ADMIN_PLAYGROUND_MONTHLY_BAVERAGE,
  USERS_PLAYGROUND_LUNCH_GROUP,
  USERS_PLAYGROUND_MONTHLY_BAVERAGE,
} from './swagger/playground.swagger';
import { ResponseInterface } from '@common/interface/response.interface';
import { AdminRole, UserRole } from '@common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '@common/constant/enum';
import { UserAuthGuard } from '@auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '@auth/guard/roleGuard/userRole.guard';
import { AdminRoleGuard } from '@auth/guard/roleGuard/adminRole.guard';
import { AdminAuthGuard } from '@auth/guard/authGuard/adminAuth.guard';
import { CreateLunchGroupDto } from './dto/createLunchGroup.dto';
import { CurrentUser } from '@common/decorator/currentUser.decorator';
import { UserPayload } from '@common/interface/payload.interface';
import { CreateMonthlyBaverageDto } from './dto/createMonthlyBaverage.dto';
import { UpdateBaverage } from './dto/updateBaverage.dto';

@ApiTags('사용자')
@Controller('users/playground')
export class UserPlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @ApiOperation(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_OPERATION)
  @ApiCreatedResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('lunch-group')
  async pickLunchGroup(@CurrentUser() { userName }: UserPayload): Promise<ResponseInterface> {
    const group: number = await this.playgroundService.pickLunchGroup(userName);

    const response: ResponseInterface = { message: 'success', data: { userName, group } };

    return response;
  }

  @ApiOperation(USERS_PLAYGROUND_LUNCH_GROUP.GET.API_OPERATION)
  @ApiOkResponse(USERS_PLAYGROUND_LUNCH_GROUP.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('lunch-group')
  async getLunchGroupForUser(@CurrentUser() { userName }: UserPayload): Promise<ResponseInterface> {
    const data: any = await this.playgroundService.getLunchGroupForUser(userName);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_PLAYGROUND_MONTHLY_BAVERAGE.PUT.API_OPERATION)
  @ApiOkResponse(USERS_PLAYGROUND_MONTHLY_BAVERAGE.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Put('monthly-baverage')
  async updateMonthlyBaverage(@Body() dto: UpdateBaverage): Promise<ResponseInterface> {
    await this.playgroundService.updateMonthlyBaverage(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_OPERATION)
  @ApiQuery(USERS_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_QUERY1)
  @ApiOkResponse(USERS_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('monthly-baverage')
  async getMonthlyBaverageForUser(
    @Query('month', ParseIntPipe) month: string,
    @CurrentUser() { userName }: UserPayload,
  ): Promise<ResponseInterface> {
    const data: any = await this.playgroundService.getMonthlyBaverageForUser(month, userName);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/playground')
export class AdminPlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @ApiOperation(ADMIN_PLAYGROUND_LUNCH_GROUP.POST.API_OPERATION)
  @ApiCreatedResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('lunch-group')
  async setLunchGroup(@Body() lunchGroupInfo: CreateLunchGroupDto): Promise<ResponseInterface> {
    await this.playgroundService.setLunchGroup(lunchGroupInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_LUNCH_GROUP.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('lunch-group')
  async getLunchGroupForAdmin(): Promise<ResponseInterface> {
    const data: any = await this.playgroundService.getLunchGroupForAdmin();

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_LUNCH_GROUP.DELETE.API_OPERATION)
  @ApiOkResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.DELETE.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Delete('lunch-group')
  async deleteLunchGroup(): Promise<ResponseInterface> {
    await this.playgroundService.deleteLunchGroupConfig();

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.POST.API_OPERATION)
  @ApiCreatedResponse(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('monthly-baverage')
  async setMonthlyBaverage(@Body() monthlyBaverageInfo: CreateMonthlyBaverageDto): Promise<ResponseInterface> {
    await this.playgroundService.setMonthlyBaverage(monthlyBaverageInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_OPERATION)
  @ApiQuery(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_QUERY1)
  @ApiOkResponse(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('monthly-baverage')
  async getMonthlyBaverageForAdmin(@Query('month', ParseIntPipe) month: string): Promise<ResponseInterface> {
    const data: any = await this.playgroundService.getMonthlyBaverageForAdmin(month);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.PUT.API_OPERATION)
  @ApiOkResponse(ADMIN_PLAYGROUND_MONTHLY_BAVERAGE.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Put('monthly-baverage')
  async updateMonthlyBaverage(@Body() dto: UpdateBaverage): Promise<ResponseInterface> {
    await this.playgroundService.updateMonthlyBaverage(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
