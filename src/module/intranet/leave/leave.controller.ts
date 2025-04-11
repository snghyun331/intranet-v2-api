import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { LeaveService } from './leave.service';
import { ResponseInterface } from '../../../common/interface/response.interface';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ADMIN_INTRANET_LEAVE,
  ADMIN_INTRANET_LEAVE_ALL_CALENDER,
  ADMIN_INTRANET_LEAVE_DETAIL,
  ADMIN_INTRANET_LEAVE_NOTE,
  ADMIN_INTRANET_LEAVE_STATS,
  UploadLeaveImage,
  USERS_INTRANET_LEAVE,
  USERS_INTRANET_LEAVE_ALL_CALENDER,
  USERS_INTRANET_LEAVE_DETAIL,
  USERS_INTRANET_LEAVE_IMAGE,
  USERS_INTRANET_LEAVE_STATS,
} from './swagger/leave.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { AdminRole, UserRole } from '../../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../../common/constant/enum';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CreateLeaveDto, LeaveRequestDto } from './dto/createLeave.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { leaveImageOptions } from '../../file/uploadMulter.options';
import { CurrentUser, CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';
import { AdminAuthGuard } from '../../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../../auth/guard/roleGuard/adminRole.guard';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto, UserLeaveDetailFilterDto } from './dto/query.dto';
import { UserPayload } from '../../../common/interface/payload.interface';
import { UpdateAnnualLeaveDto } from './dto/updateAnnualLeave.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';

@ApiTags('사용자')
@Controller('users/intranet/leave')
export class UserLeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation(USERS_INTRANET_LEAVE.POST.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse(USERS_INTRANET_LEAVE.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_INTRANET_LEAVE.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor, FileInterceptor('leaveImage', leaveImageOptions))
  @Post()
  async createLeave(
    @Body() { dto }: CreateLeaveDto,
    @CurrentUser() user: UserPayload,
    @TransactionManager() manager: EntityManager,
    @UploadedFile() leaveImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    const parsedDto: LeaveRequestDto = dto as LeaveRequestDto;
    await this.leaveService.createLeave(parsedDto, user, manager, leaveImage);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE.DELETE.API_OPERATION)
  @ApiParam(USERS_INTRANET_LEAVE.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_INTRANET_LEAVE.DELETE.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor)
  @Delete(':commuteIdx')
  async deleteLeave(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.leaveService.deleteLeave(commuteIdx, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE.GET.API_OPERATION)
  @ApiQuery(USERS_INTRANET_LEAVE.GET.API_QUERY1)
  @ApiOkResponse(USERS_INTRANET_LEAVE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getAnnualLeaveSummary(
    @Query('year') year: string,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getAnnualLeaveSummary(userIdx, year);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE_ALL_CALENDER.GET.API_OPERATION)
  @ApiQuery(USERS_INTRANET_LEAVE_ALL_CALENDER.GET.API_QUERY1)
  @ApiOkResponse(USERS_INTRANET_LEAVE_ALL_CALENDER.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('all/calender')
  async getAllUsersLeaveByCalender(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getAllUsersLeaveByMonth(year, month);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE_STATS.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRANET_LEAVE_STATS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('stats')
  async getUserLeaveStats(@CurrentUserIdx() userIdx: number, @Query('year') year: string): Promise<ResponseInterface> {
    const data = await this.leaveService.getUserLeaveStats(year, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE_DETAIL.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRANET_LEAVE_DETAIL.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('detail')
  async getUserLeaveInfo(
    @CurrentUserIdx() userIdx: number,
    @Query() filterInfo: UserLeaveDetailFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getUserLeaveInfo(filterInfo, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE_IMAGE.PATCH.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiParam(USERS_INTRANET_LEAVE_IMAGE.PATCH.API_PARAM1)
  @ApiOkResponse(USERS_INTRANET_LEAVE_IMAGE.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor, FileInterceptor('leaveImage', leaveImageOptions))
  @UploadLeaveImage()
  @Patch(':commuteIdx/image')
  async updateLeaveImage(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @TransactionManager() manager: EntityManager,
    @UploadedFile() leaveImage: Express.Multer.File,
  ): Promise<ResponseInterface> {
    await this.leaveService.updateLeaveImage(commuteIdx, leaveImage, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/intranet/leave')
export class AdminLeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation(ADMIN_INTRANET_LEAVE.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getLeaveSummaries(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminLeaveFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getLeaveSummaries(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE.PATCH.API_OPERATION)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(TransactionInterceptor)
  @Patch(':leaveStatsIdx')
  async updateUserTotalReceivedAnnualLeave(
    @Param('leaveStatsIdx', ParseIntPipe) leaveStatsIdx: number,
    @Body() dto: UpdateAnnualLeaveDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.leaveService.updateUserTotalReceivedAnnualLeave(leaveStatsIdx, dto, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE_NOTE.PATCH.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_LEAVE_NOTE.PATCH.API_PARAM1)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE_NOTE.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_INTRANET_LEAVE_NOTE.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch(':leaveStatsIdx/note')
  async updateLeaveStatsNote(
    @Param('leaveStatsIdx', ParseIntPipe) leaveStatsIdx: number,
    @Body() noteInfo: UpdateNoteDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.leaveService.updateLeaveStatsNote(leaveStatsIdx, noteInfo, manager);

    const response: ResponseInterface = { message: '비고 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE_STATS.GET.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_LEAVE_STATS.GET.API_PARAM1)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE_STATS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('users/:userIdx/stats')
  async getUserLeaveStats(
    @Param('userIdx', ParseIntPipe) userIdx: number,
    @Query('year') year: string,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getUserLeaveStats(year, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE_DETAIL.GET.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_LEAVE_DETAIL.GET.API_PARAM1)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE_DETAIL.GET.API_OPERATION)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('users/:userIdx')
  async getUserLeaveInfo(
    @Param('userIdx', ParseIntPipe) userIdx: number,
    @Query() filterInfo: AdminLeaveDetailFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getUserLeaveInfo(filterInfo, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE_ALL_CALENDER.GET.API_OPERATION)
  @ApiQuery(ADMIN_INTRANET_LEAVE_ALL_CALENDER.GET.API_QUERY1)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE_ALL_CALENDER.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('all/calender')
  async getAllUsersLeaveByCalender(
    @Query('year') year: string,
    @Query('month') month: string,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getAllUsersLeaveByMonth(year, month);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_LEAVE_DETAIL.DELETE.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_LEAVE_DETAIL.DELETE.API_PARAM1)
  @ApiOkResponse(ADMIN_INTRANET_LEAVE_DETAIL.DELETE.API_OK_RESPONSE)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @ApiBearerAuth('accessToken')
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(TransactionInterceptor)
  @Delete('commute/:commuteIdx')
  async deleteLeaveByAdmin(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.leaveService.deleteLeave(commuteIdx, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
