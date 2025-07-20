import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ADMIN_NOTICES,
  ADMIN_NOTICES_DETAIL,
  USERS_NOTICES,
  USERS_NOTICES_DETAIL,
  USERS_NOTICES_HAS_NEW,
} from './swagger/notice.swagger';
import { ResponseInterface } from '@common/interface/response.interface';
import { NoticeService } from './notice.service';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { AdminGradeEnum, UserGradeEnum } from '@common/constant/enum';
import { AdminRole, UserRole } from '@common/decorator/role.decorator';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { CurrentAdmin } from '@common/decorator/currentAdmin.decorator';
import { AdminPayload, UserPayload } from '@common/interface/payload.interface';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { UpdateNoticeDto } from './dto/updateNotice.dto';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { noticeImageOptions } from '../file/uploadMulter.options';
import { AdminNoticeFilterDto, UserNoticeFilterDto } from './dto/query.dto';
import { CurrentUserIdx } from '@common/decorator/currentUser.decorator';

@ApiTags('사용자')
@Controller('users/notices')
export class UserNoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @ApiOperation(USERS_NOTICES.POST.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse(USERS_NOTICES.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(FileInterceptor('noticeImage', noticeImageOptions))
  @Post()
  async createNotice(
    @Body() noticeInfo: CreateNoticeDto,
    @CurrentAdmin() { userName }: UserPayload,
    @UploadedFile() noticeImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    await this.noticeService.createNoticeForUser(noticeInfo, userName, noticeImage);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_NOTICES.GET.API_OPERATION)
  @ApiOkResponse(USERS_NOTICES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getNoticeList(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: UserNoticeFilterDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const data = await this.noticeService.getNoticeListForUser(pageNoInfo, filterInfo, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_NOTICES.PUT.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiParam(USERS_NOTICES.PUT.API_PARAM1)
  @ApiOkResponse(USERS_NOTICES.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(FileInterceptor('noticeImage', noticeImageOptions))
  @Put(':noticeIdx')
  async updateNotice(
    @Param('noticeIdx', ParseIntPipe) noticeIdx: number,
    @Body() noticeInfo: UpdateNoticeDto,
    @CurrentAdmin() { userName }: UserPayload,
    @UploadedFile() noticeImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    const imageInfo = await this.noticeService.updateNoticeByUser(userName, noticeIdx, noticeInfo, noticeImage);

    const response: ResponseInterface = { message: 'success', data: imageInfo };

    return response;
  }

  @ApiOperation(USERS_NOTICES.DELETE.API_OPERATION)
  @ApiParam(USERS_NOTICES.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_NOTICES.DELETE.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Delete(':noticeIdx')
  async deleteUserNotice(@Param('noticeIdx', ParseIntPipe) noticeIdx: number): Promise<ResponseInterface> {
    const data = await this.noticeService.deleteNotice(noticeIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_NOTICES_HAS_NEW.GET.API_OPERATION)
  @ApiOkResponse(USERS_NOTICES_HAS_NEW.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('has-new')
  async hasNewNoticeHistory(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const hasNew: boolean = await this.noticeService.hasNewNotice(userIdx);

    const response: ResponseInterface = {
      message: 'success',
      data: { hasNew },
    };

    return response;
  }

  @ApiOperation(USERS_NOTICES_DETAIL.GET.API_OPERATION)
  @ApiParam(USERS_NOTICES_DETAIL.GET.API_PARAM1)
  @ApiOkResponse(USERS_NOTICES_DETAIL.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_NOTICES_DETAIL.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get(':noticeIdx')
  async getNoticeDetail(
    @Param('noticeIdx', ParseIntPipe) noticeIdx: number,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const data = await this.noticeService.getNoticeDetailForUser(noticeIdx, userIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/notices')
export class AdminNoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @ApiOperation(ADMIN_NOTICES.POST.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse(ADMIN_NOTICES.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(FileInterceptor('noticeImage', noticeImageOptions))
  @Post()
  async createNotice(
    @Body() noticeInfo: CreateNoticeDto,
    @CurrentAdmin() { adminName }: AdminPayload,
    @UploadedFile() noticeImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    await this.noticeService.createNoticeForAdmin(noticeInfo, adminName, noticeImage);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_NOTICES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getNoticeList(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo?: AdminNoticeFilterDto,
  ): Promise<ResponseInterface> {
    const data = await this.noticeService.getNoticeListForAdmin(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES_DETAIL.GET.API_OPERATION)
  @ApiParam(ADMIN_NOTICES_DETAIL.GET.API_PARAM1)
  @ApiOkResponse(ADMIN_NOTICES_DETAIL.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_NOTICES_DETAIL.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get(':noticeIdx')
  async getNoticeDetail(@Param('noticeIdx', ParseIntPipe) noticeIdx: number): Promise<ResponseInterface> {
    const data = await this.noticeService.getNoticeDetailForAdmin(noticeIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES.PUT.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiParam(ADMIN_NOTICES.PUT.API_PARAM1)
  @ApiOkResponse(ADMIN_NOTICES.PUT.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_NOTICES.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(FileInterceptor('noticeImage', noticeImageOptions))
  @Put(':noticeIdx')
  async updateNotice(
    @Param('noticeIdx', ParseIntPipe) noticeIdx: number,
    @Body() noticeInfo: UpdateNoticeDto,
    @CurrentAdmin() { adminName }: AdminPayload,
    @UploadedFile() noticeImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    const imageInfo = await this.noticeService.updateNoticeByAdmin(adminName, noticeIdx, noticeInfo, noticeImage);

    const response: ResponseInterface = { message: 'success', data: imageInfo };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES.DELETE.API_OPERATION)
  @ApiParam(ADMIN_NOTICES.DELETE.API_PARAM1)
  @ApiOkResponse(ADMIN_NOTICES.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_NOTICES.DELETE.API_BAD_REQUEST_RESPONSE)
  @Delete(':noticeIdx')
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  async deleteNotice(@Param('noticeIdx', ParseIntPipe) noticeIdx: number): Promise<ResponseInterface> {
    await this.noticeService.deleteNotice(noticeIdx);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
