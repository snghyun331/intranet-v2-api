import {
  Body,
  Controller,
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
  ADMIN_INTRANET_LEAVE_DETAIL,
  ADMIN_INTRANET_LEAVE_NOTE,
  ADMIN_INTRANET_LEAVE_STATS,
  USERS_INTRANET_LEAVE,
  USERS_INTRANET_LEAVE_ALL,
  USERS_INTRANET_LEAVE_DETAIL,
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
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';
import { AdminAuthGuard } from '../../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../../auth/guard/roleGuard/adminRole.guard';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminLeaveDetailFilterDto, AdminLeaveFilterDto } from './dto/query.dto';
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
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
    @UploadedFile() leaveImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    const parsedDto: LeaveRequestDto = dto as LeaveRequestDto;
    await this.leaveService.createLeave(parsedDto, userIdx, manager, leaveImage);

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
  async getLeaveSummary(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const data = await this.leaveService.getLeaveSummary(userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_LEAVE_ALL.GET.API_OPERATION)
  @ApiQuery(USERS_INTRANET_LEAVE_ALL.GET.API_QUERY1)
  @ApiOkResponse(USERS_INTRANET_LEAVE_ALL.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('all')
  async getAllUsersLeaveByDate(@Query('date') date: string): Promise<ResponseInterface> {
    const data = await this.leaveService.getAllUsersLeaveByDate(date);

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
  @ApiOkResponse(USERS_INTRANET_LEAVE_DETAIL.GET.API_OPERATION)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('detail')
  async getUserLeaveInfo(
    @CurrentUserIdx() userIdx: number,
    @Query() filterInfo: AdminLeaveDetailFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.leaveService.getUserLeaveInfo(filterInfo, userIdx);

    const response: ResponseInterface = { message: 'success', data };

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
}
