import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRole } from '../../common/decorator/role.decorator';
import { USERS_MEETING, USERS_MEETING_ROOM } from './swagger/meeting.swagger';
import { MeetingService } from './meeting.service';
import { CreateMeetingReservationDto } from './dto/createMeeting.dto';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';

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
  async createMeetingReservation(
    @Body() dto: CreateMeetingReservationDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    await this.meetingService.createReservation(dto, userIdx);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_MEETING.DELETE.API_OPERATION)
  @ApiOkResponse(USERS_MEETING.DELETE.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Delete(':reservationIdx')
  async deleteMeetingReservation(
    @Param('reservationIdx', ParseIntPipe) reservationIdx: number,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    await this.meetingService.deleteReservation(reservationIdx, userIdx);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(USERS_MEETING_ROOM.GET.API_OPERATION)
  @ApiOkResponse(USERS_MEETING_ROOM.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('available-rooms')
  async getAvailableMeetingRoom(): Promise<ResponseInterface> {
    const data = await this.meetingService.getAvailableRoom();

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }

  @ApiOperation(USERS_MEETING.GET.API_OPERATION)
  @ApiOkResponse(USERS_MEETING.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getMeetingSchedule(@Query('meetingDate') meetingDate: string): Promise<ResponseInterface> {
    const data = await this.meetingService.getMeetingSchedule(meetingDate);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}
