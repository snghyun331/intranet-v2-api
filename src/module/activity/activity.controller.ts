import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { USERS_ACTIVITIES } from './swagger/activity.swagger';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRolesGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CreateActivityDto } from './dto/createActivity.dto';
import { UpdateActivityDto } from './dto/updateActivity.dto';
import { ResponseInterface } from '../../common/interface/response.interface';

@ApiTags('활동비(USER)')
@Controller('users/activities')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @ApiOperation(USERS_ACTIVITIES.POST.API_OPERATION)
  @ApiBody(USERS_ACTIVITIES.POST.API_BODY)
  @ApiCreatedResponse(USERS_ACTIVITIES.POST.API_CREATED_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.POST.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @Post()
  async createActivity(
    @Body() activityInfo: CreateActivityDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.createActivity(userIdx, activityInfo, manager);

    const response: ResponseInterface = { message: '활동비 사용내역 저장 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.PUT.API_OPERATION)
  @ApiParam(USERS_ACTIVITIES.PUT.API_PARAM1)
  @ApiBody(USERS_ACTIVITIES.PUT.API_BODY)
  @ApiOkResponse(USERS_ACTIVITIES.PUT.API_OK_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.PUT.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiNotFoundResponse(USERS_ACTIVITIES.PUT.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @UseInterceptors(TransactionInterceptor)
  @Put(':activityIdx')
  async updateActivity(
    @Param('activityIdx', ParseIntPipe) activityIdx: number,
    @Body() activityInfo: UpdateActivityDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.updateActivity(userIdx, activityIdx, activityInfo, manager);

    const response: ResponseInterface = { message: '활동비 사용내역 수정 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.DELETE.API_OPERATION)
  @ApiParam(USERS_ACTIVITIES.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_ACTIVITIES.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_ACTIVITIES.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiForbiddenResponse(USERS_ACTIVITIES.DELETE.API_FORBIDDEN_RESPONSE)
  @ApiNotFoundResponse(USERS_ACTIVITIES.DELETE.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.MANAGER)
  @UseInterceptors(TransactionInterceptor)
  @Delete(':activityIdx')
  async deleteActivity(
    @Param('activityIdx', ParseIntPipe) activityIdx: number,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.activityService.deleteActivity(userIdx, activityIdx, manager);

    const response: ResponseInterface = { message: '활동비 사용내역 초기화 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_ACTIVITIES.GET.API_OPERATION)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getWelfare(): Promise<ResponseInterface> {
    const response: ResponseInterface = { message: '복포 사용내역 조회 성공' };

    return response;
  }
}
