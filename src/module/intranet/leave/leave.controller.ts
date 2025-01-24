import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { USERS_INTRANET_LEAVE } from './swagger/leave.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../../common/decorator/role.decorator';
import { UserGradeEnum } from '../../../common/constant/enum';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CreateLeaveDto } from './dto/createLeave.dto';

@Controller('users/intranet')
export class UserLeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation(USERS_INTRANET_LEAVE.POST.API_OPERATION)
  @ApiBody(USERS_INTRANET_LEAVE.POST.API_BODY)
  @ApiCreatedResponse(USERS_INTRANET_LEAVE.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('leave')
  async createLeave(
    @Body() leaveInfo: CreateLeaveDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.leaveService.createLeave(leaveInfo, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
