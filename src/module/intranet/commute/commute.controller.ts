import * as moment from 'moment';
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
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { CommuteService } from './commute.service';
import { CheckInDto } from './dto/checkIn.dto';
import {
  ADMIN_INTRANET_COMMUTE,
  ADMIN_INTRANET_COMMUTE_NOTE,
  ADMIN_INTRANET_COMMUTE_TIME,
  USERS_INTRAENT_COMMUTE,
  USERS_INTRANET_CHECK_IN,
  USERS_INTRANET_CHECK_OUT,
} from './swagger/commute.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { AdminRole, UserRole } from '../../../common/decorator/role.decorator';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { AdminGradeEnum, UserGradeEnum } from '../../../common/constant/enum';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';
import { CheckOutDto } from './dto/checkOut.dto';
import { AdminAuthGuard } from '../../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../../auth/guard/roleGuard/adminRole.guard';
import { AdminCommuteFilterDto, UserCommuteFilterDto } from './dto/query.dto';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
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
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('check-in')
  async checkInWork(
    @Ip() checkInIpAddr: string,
    @Headers() headers: object,
    @CurrentUserIdx() userIdx: number,
    @Body() checkInDto: CheckInDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const checkInLogAgent: string = headers['user-agent'];
    await this.commuteService.checkInWork(userIdx, checkInDto, checkInLogAgent, checkInIpAddr, manager);

    const response: ResponseInterface = { message: 'success', data: { checkInTime: checkInDto.checkInTime } };

    return response;
  }

  @ApiOperation(USERS_INTRANET_CHECK_OUT.PUT.API_OPERATION)
  @ApiBody(USERS_INTRANET_CHECK_OUT.PUT.API_BODY)
  @ApiOkResponse(USERS_INTRANET_CHECK_OUT.PUT.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_INTRANET_CHECK_OUT.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Put('check-out')
  async checkOutWork(
    @Ip() checkOutIpAddr: string,
    @Headers() headers: object,
    @CurrentUserIdx() userIdx: number,
    @Body() checkOutDto: CheckOutDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const checkOutLogAgent: string = headers['user-agent'];
    await this.commuteService.checkOutWork(userIdx, checkOutDto, checkOutIpAddr, checkOutLogAgent, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRAENT_COMMUTE.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRAENT_COMMUTE.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
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
    if (!filterInfo.sDate || !filterInfo.eDate) {
      filterInfo.sDate = moment().utcOffset(9).format('YYYY-MM-DD');
      filterInfo.eDate = moment().utcOffset(9).format('YYYY-MM-DD');
    }
    const data = await this.commuteService.getCommuteRecords(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE.DELETE.API_OPERATION)
  @ApiBody(ADMIN_INTRANET_COMMUTE.DELETE.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE.DELETE.API_OPERATION)
  @UseInterceptors(TransactionInterceptor)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Delete('commute')
  async deleteUserCommuteRecord(
    @Body('commuteIdxList') commuteIdxList: number[],
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.deleteUserCommuteRecord(commuteIdxList, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_PARAM1)
  @ApiBody(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE_TIME.PUT.API_OK_RESPONSE)
  @UseInterceptors(TransactionInterceptor)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Put('commute/:commuteIdx/time')
  async updateCommuteTime(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() updateInfo: UpdateCommuteTimeDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.updateCommuteTime(commuteIdx, updateInfo, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_OPERATION)
  @ApiParam(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_PARAM1)
  @ApiBody(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_INTRANET_COMMUTE_NOTE.PATCH.API_OK_RESPONSE)
  @UseInterceptors(TransactionInterceptor)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('commute/:commuteIdx/note')
  async updateCommuteNote(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() noteInfo: UpdateNoteDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.updateCommuteNote(commuteIdx, noteInfo, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
