import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseInterface } from '@common/interface/response.interface';
import { CommuteService } from './commute.service';
import { CheckInDto } from './dto/checkIn.dto';
import {
  ADMIN_INTRANET_COMMUTE,
  ADMIN_INTRANET_COMMUTE_NOTE,
  ADMIN_INTRANET_COMMUTE_TIME,
  USER_INTRANET_COMMUTE_NOTE,
  USERS_INTRAENT_COMMUTE,
  USERS_INTRANET_CHECK_IN,
  USERS_INTRANET_CHECK_OUT,
  USERS_INTRANET_COMMUTE_WORK_HOURS,
  USERS_INTRANET_HOLIDAY,
} from './swagger/commute.swagger';
import { UserRoleGuard } from '@auth/guard/roleGuard/userRole.guard';
import { AdminRole, UserRole } from '@common/decorator/role.decorator';
import { UserAuthGuard } from '@auth/guard/authGuard/userAuth.guard';
import { AdminGradeEnum, RequestTypeEnum, UserGradeEnum } from '@common/constant/enum';
import { CurrentUserIdx } from '@common/decorator/currentUser.decorator';
import { CheckOutDto } from './dto/checkOut.dto';
import { AdminAuthGuard } from '@auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '@auth/guard/roleGuard/adminRole.guard';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { UpdateCommuteTimeDto } from './dto/updateCommuteTime.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';

@ApiTags('사용자')
@Controller('users/intranet')
export class UserCommuteController {
  constructor(private readonly commuteService: CommuteService) {}

  @ApiOperation(USERS_INTRANET_CHECK_IN.POST.API_OPERATION)
  @ApiBody(USERS_INTRANET_CHECK_IN.POST.API_BODY)
  @ApiCreatedResponse(USERS_INTRANET_CHECK_IN.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_INTRANET_CHECK_IN.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('check-in')
  async checkInWork(
    @Ip() checkInIpAddr: string,
    @Headers() headers: object,
    @CurrentUserIdx() userIdx: number,
    @Body() checkInDto: CheckInDto,
  ): Promise<ResponseInterface> {
    const checkInLogAgent: string = headers['user-agent'];
    await this.commuteService.checkInWork(userIdx, checkInDto, checkInLogAgent, checkInIpAddr);

    const response: ResponseInterface = { message: 'success', data: { checkInTime: checkInDto.checkInTime } };

    return response;
  }

  @ApiOperation(USERS_INTRANET_CHECK_OUT.PUT.API_OPERATION)
  @ApiBody(USERS_INTRANET_CHECK_OUT.PUT.API_BODY)
  @ApiOkResponse(USERS_INTRANET_CHECK_OUT.PUT.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_INTRANET_CHECK_OUT.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Put('check-out')
  async checkOutWork(
    @Ip() checkOutIpAddr: string,
    @Headers() headers: object,
    @CurrentUserIdx() userIdx: number,
    @Body() checkOutDto: CheckOutDto,
  ): Promise<ResponseInterface> {
    const checkOutLogAgent: string = headers['user-agent'];
    await this.commuteService.checkOutWork(userIdx, checkOutDto, checkOutIpAddr, checkOutLogAgent);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRAENT_COMMUTE.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRAENT_COMMUTE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('commute')
  async getUserCommuteRecords(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: UserCommuteFilterDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const data = await this.commuteService.getUserCommuteRecords(userIdx, pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_COMMUTE_WORK_HOURS.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRANET_COMMUTE_WORK_HOURS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('commute/work-hours')
  async getWeelyWorkHours(
    @Query('year') year: string,
    @Query('month') month: string,
    @CurrentUserIdx() userIdx: number,
  ) {
    const data = await this.commuteService.getUserWeelyWorkHours(userIdx, year, month);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USER_INTRANET_COMMUTE_NOTE.PATCH.API_OPERATION)
  @ApiParam(USER_INTRANET_COMMUTE_NOTE.PATCH.API_PARAM1)
  @ApiBody(USER_INTRANET_COMMUTE_NOTE.PATCH.API_BODY)
  @ApiOkResponse(USER_INTRANET_COMMUTE_NOTE.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Patch('commute/:commuteIdx/note')
  async updateCommuteNote(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() noteInfo: UpdateNoteDto,
  ): Promise<ResponseInterface> {
    await this.commuteService.updateCommuteNote(commuteIdx, noteInfo, RequestTypeEnum.USER);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRANET_HOLIDAY.GET.API_OPERATION)
  @ApiQuery(USERS_INTRANET_HOLIDAY.GET.API_QUERY1)
  @ApiQuery(USERS_INTRANET_HOLIDAY.GET.API_QUERY2)
  @ApiOkResponse(USERS_INTRANET_HOLIDAY.GET.API_OK_RESPONSE)
  @Get('holiday')
  async getHolidayDates(@Query('year') year: string, @Query('month') month: string): Promise<ResponseInterface> {
    const data = await this.commuteService.getHolidayDates(year, month);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/intranet')
export class AdminCommuteController {
  constructor(private readonly commuteService: CommuteService) {}

  @ApiOperation(ADMIN_INTRANET_COMMUTE.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('commute')
  async getCommuteRecords(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminCommuteFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.commuteService.getCommuteRecords(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE.DELETE.API_OPERATION)
  @ApiBody(ADMIN_INTRANET_COMMUTE.DELETE.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE.DELETE.API_OPERATION)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Delete('commute')
  async deleteUserCommuteRecord(@Body('commuteIdxList') commuteIdxList: number[]): Promise<ResponseInterface> {
    await this.commuteService.deleteUserCommuteRecord(commuteIdxList);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_PARAM1)
  @ApiBody(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Put('commute/:commuteIdx/time')
  async updateCommuteTime(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() updateInfo: UpdateCommuteTimeDto,
  ): Promise<ResponseInterface> {
    await this.commuteService.updateCommuteTime(commuteIdx, updateInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_PARAM1)
  @ApiBody(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('commute/:commuteIdx/note')
  async updateCommuteNote(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() noteInfo: UpdateNoteDto,
  ): Promise<ResponseInterface> {
    await this.commuteService.updateCommuteNote(commuteIdx, noteInfo, RequestTypeEnum.ADMIN);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
