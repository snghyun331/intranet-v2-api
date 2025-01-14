import { Body, Controller, Post, Put, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { CommuteService } from './commute.service';
import { CheckInDto } from './dto/checkIn.dto';
import { USERS_INTRANET_CHECK_IN, USERS_INTRANET_CHECK_OUT } from './swagger/commute.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../../common/decorator/role.decorator';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { UserGradeEnum } from '../../../common/constant/enum';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';
import { CheckOutDto } from './dto/checkOut.dto';

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
    @Body() checkInDto: CheckInDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.checkInWork(userIdx, checkInDto, manager);

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
    @CurrentUserIdx() userIdx: number,
    @Body() checkOutDto: CheckOutDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.commuteService.checkOutWork(userIdx, checkOutDto, manager);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
