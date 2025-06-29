import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRole } from '../../common/decorator/role.decorator';
import { USERS_MEETING } from './swagger/meeting.swagger';
import { MeetingService } from './meeting.service';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';

@ApiTags('사용자')
@Controller('users/meetings')
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @ApiOperation(USERS_MEETING.POST.API_OPERATION)
  @ApiCreatedResponse(USERS_MEETING.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post()
  async createMeetingReservation(@Body() dto: CreateMeetingReservationDto): Promise<ResponseInterface> {
    await this.meetingService.createReservation(dto);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
