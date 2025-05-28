import { Body, Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { USERS_INTRANET_APPROVAL, USERS_INTRANET_APPROVAL_HAS_NEW } from './swagger/approval.swagger';
import { UserRole } from '@common/decorator/role.decorator';
import { UserAuthGuard } from '@auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '@auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '@common/constant/enum';
import { CurrentUserIdx } from '@common/decorator/currentUser.decorator';
import { ResponseInterface } from '@common/interface/response.interface';
import { UpdateConfirmDto } from './dto/updateConfirm.dto';
import { UserApprovalFilter } from './dto/query.dto';

@ApiTags('사용자')
@Controller('users/intranet/approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @ApiOperation(USERS_INTRANET_APPROVAL.PATCH.API_OPERATION)
  @ApiParam(USERS_INTRANET_APPROVAL.PATCH.API_PARAM1)
  @ApiBody(USERS_INTRANET_APPROVAL.PATCH.API_BODY)
  @ApiOkResponse(USERS_INTRANET_APPROVAL.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Patch(':commuteIdx')
  async confirmLeave(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() { confirmYN }: UpdateConfirmDto,
    @CurrentUserIdx() confirmPersonIdx: number,
  ): Promise<ResponseInterface> {
    await this.approvalService.confirmLeave(commuteIdx, confirmPersonIdx, confirmYN);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_INTRANET_APPROVAL.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRANET_APPROVAL.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getApprovalHistory(
    @Query() filterInfo: UserApprovalFilter,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const data = await this.approvalService.getApprovalHistory(userIdx, filterInfo);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_INTRANET_APPROVAL_HAS_NEW.GET.API_OPERATION)
  @ApiOkResponse(USERS_INTRANET_APPROVAL_HAS_NEW.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('has-new')
  async hasNewApprovalHistory(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const hasNew: boolean = await this.approvalService.hasNewApproval(userIdx);

    const response: ResponseInterface = {
      message: 'success',
      data: { hasNew },
    };

    return response;
  }
}
