import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRole } from '../../common/decorator/role.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { NotificationService } from './notification.sevice';
import { SendSmsDto } from './sms/dto/sendSms.dto';
import { USERS_SMS } from './swagger/sms.swagger';

@ApiTags('사용자')
@Controller('users/sms')
export class UserSmsController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation(USERS_SMS.POST.API_OPERATION)
  @ApiCreatedResponse(USERS_SMS.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Post()
  async sendSms(@Body() dto: SendSmsDto): Promise<ResponseInterface> {
    await this.notificationService.sendSms(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
