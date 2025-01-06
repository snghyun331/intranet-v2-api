import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { ADMIN_NOTICES, ADMIN_NOTICES_DETAIL } from './swagger/notice.swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { NoticeService } from './notice.service';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { AdminGradeEnum } from '../../common/constant/enum';
import { AdminRole } from '../../common/decorator/role.decorator';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CurrentAdmin } from '../../common/decorator/currentAdmin.decorator';
import { AdminPayload } from '../../common/interface/payload.interface';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { NoticeAdminResult } from './interface/result.interface';
import { NoticeDetailInfo } from './interface/notice.interface';
import { UpdateNoticeDto } from './dto/updateNotice.dto';

@ApiTags('어드민')
@Controller('admin/notices')
export class NoticeController {
  constructor(private readonly noticeService: NoticeService) {}

  @ApiOperation(ADMIN_NOTICES.POST.API_OPERATION)
  @ApiBody(ADMIN_NOTICES.POST.API_BODY)
  @ApiCreatedResponse(ADMIN_NOTICES.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post()
  async createNotice(
    @Body() noticeInfo: CreateNoticeDto,
    @CurrentAdmin() { adminName }: AdminPayload,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.noticeService.createNotice(noticeInfo, adminName, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_NOTICES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getNoticeList(@Query() pageNoInfo: PageNoDto): Promise<ResponseInterface> {
    const data: NoticeAdminResult = await this.noticeService.getNoticeList(pageNoInfo);

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
    const data: NoticeDetailInfo = await this.noticeService.getNoticeDetail(noticeIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(ADMIN_NOTICES.PUT.API_OPERATION)
  @ApiParam(ADMIN_NOTICES.PUT.API_PARAM1)
  @ApiBody(ADMIN_NOTICES.PUT.API_BODY)
  @ApiOkResponse(ADMIN_NOTICES.PUT.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(TransactionInterceptor)
  @Put(':noticeIdx')
  async updateNotice(
    @Param('noticeIdx', ParseIntPipe) noticeIdx: number,
    @Body() noticeInfo: UpdateNoticeDto,
    @CurrentAdmin() { adminName }: AdminPayload,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.noticeService.updateNotice(adminName, noticeIdx, noticeInfo, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
