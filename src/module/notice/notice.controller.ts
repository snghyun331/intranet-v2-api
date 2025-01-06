import { Body, Controller, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ADMIN_NOTICES } from './swagger/notice.swagger';
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
}
