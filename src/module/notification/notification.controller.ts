import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRole } from '../../common/decorator/role.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { NotificationService } from './notification.sevice';
import { SendSmsDto } from './sms/dto/sendSms.dto';
import { USERS_NOTIFICATION_SMS } from './swagger/sms.swagger';
import { UserSmsFilterDto } from './sms/dto/query.dto';

@ApiTags('사용자')
@Controller('users/notification')
export class UserNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation(USERS_NOTIFICATION_SMS.POST.API_OPERATION)
  @ApiCreatedResponse(USERS_NOTIFICATION_SMS.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('sms')
  async sendSms(@Body() dto: SendSmsDto): Promise<ResponseInterface> {
    await this.notificationService.sendSms(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_NOTIFICATION_SMS.GET.API_OPERATION)
  @ApiOkResponse(USERS_NOTIFICATION_SMS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('sms')
  async getSmsRecord(@Query() filterInfo: UserSmsFilterDto): Promise<ResponseInterface> {
    await this.notificationService.getSmsSendHistory(filterInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
