import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { CommuteService } from './commute.service';
import { StartWorkDto } from './dto/startWork.dto';
import { USERS_INTRANET_CHECK_IN } from './swagger/commute.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../../common/decorator/role.decorator';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { UserGradeEnum } from '../../../common/constant/enum';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';

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
    @CurrentUserIdx() userIdx: number,
    @Body() startWorkDto: StartWorkDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.checkInWork(userIdx, startWorkDto, manager);

    const response: ResponseInterface = { message: 'success', data: { startTime: startWorkDto.checkInTime } };

    return response;
  }
}
