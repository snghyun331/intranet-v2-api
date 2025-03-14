import { Body, Controller, Param, ParseIntPipe, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { USERS_INTRANET_APPROVAL } from './swagger/approval.swagger';
import { UserRole } from '../../../common/decorator/role.decorator';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '../../../common/constant/enum';
import { EntityManager } from 'typeorm';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { UpdateConfirmDto } from './dto/updateConfirm.dto';

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
  @UseInterceptors(TransactionInterceptor)
  @Patch(':commuteIdx')
  async confirmLeave(
    @Param('commuteIdx', ParseIntPipe) commuteIdx: number,
    @Body() { confirmYN }: UpdateConfirmDto,
    @CurrentUserIdx() confirmPersonIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.approvalService.confirmLeave(commuteIdx, confirmPersonIdx, confirmYN, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
