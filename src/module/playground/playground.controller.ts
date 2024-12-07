import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_PLAYGROUND_LUNCH_GROUP, USERS_PLAYGROUND_LUNCH_GROUP } from './swagger/playground.swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { AdminRole, UserRole } from '../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { CreateLunchGroupDto } from './dto/createLunchGroup.dto';
import { CurrentUser } from '../../common/decorator/currentUser.decorator';
import { UserPayload } from '../../common/interface/payload.interface';

@ApiTags('사용자')
@Controller('users/playground')
export class UserPlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @ApiOperation(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_OPERATION)
  @ApiBody(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_BODY)
  @ApiCreatedResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('lunch-group')
  async pickLunchGroup(
    // @CurrentUser() {userName}: UserPayload,
    @Body('userName') userName: string,
  ): Promise<ResponseInterface> {
    const group: number = await this.playgroundService.pickLunchGroup(userName);

    const response: ResponseInterface = { message: 'success', data: { userName, group } };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/playground')
export class AdminPlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @ApiOperation(ADMIN_PLAYGROUND_LUNCH_GROUP.POST.API_OPERATION)
  @ApiCreatedResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('lunch-group')
  async setLunchGroup(@Body() lunchGroupInfo: CreateLunchGroupDto): Promise<ResponseInterface> {
    await this.playgroundService.setLunchGroup(lunchGroupInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiOperation(ADMIN_PLAYGROUND_LUNCH_GROUP.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_PLAYGROUND_LUNCH_GROUP.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('lunch-group')
  async getLunchGroup(): Promise<ResponseInterface> {
    const data: any = await this.playgroundService.getLunchGroup();

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}
