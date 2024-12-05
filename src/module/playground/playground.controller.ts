import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PlaygroundService } from './playground.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { USERS_PLAYGROUND_LUNCH_GROUP } from './swagger/playground.swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { UserRole } from '../../common/decorator/role.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';

@ApiTags('사용자')
@Controller('users/playground')
export class PlaygroundController {
  constructor(private readonly playgroundService: PlaygroundService) {}

  @ApiOperation(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_OPERATION)
  @ApiBody(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_BODY)
  @ApiCreatedResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_PLAYGROUND_LUNCH_GROUP.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post('lunch-group')
  async pickLunchGroup(@Body('userName') userName: string) {
    const group: number = await this.playgroundService.pickLunchGroup(userName);

    const response: ResponseInterface = { message: 'success', data: { userName, group } };

    return response;
  }
}
