import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WelfareService } from './welfare.service';
import { CreateWelfareDto } from './dto/createWelfare.dto';
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
import { USERS_WELFARES } from './swagger/welfare.swagger';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { WelfareResult } from './interface/result.interface';
import { WelfareFilterDto } from './dto/query.dto';

@ApiTags('사용자')
@Controller('users/welfares')
export class WelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @ApiOperation(USERS_WELFARES.GET.API_OPERATION)
  @ApiOkResponse(USERS_WELFARES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getWelfare(@Query() query: WelfareFilterDto, @CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const welfares: WelfareResult = await this.welfareService.getWelfare(query.year, query.month, userIdx);

    const response: ResponseInterface = { message: '복포 사용내역 조회 성공', data: welfares };

    return response;
  }

  @ApiOperation(USERS_WELFARES.POST.API_OPERATION)
  @ApiBody(USERS_WELFARES.POST.API_BODY)
  @ApiCreatedResponse(USERS_WELFARES.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_WELFARES.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post()
  async createWelfare(
    @Body() welfareInfo: CreateWelfareDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.welfareService.createWelfare(userIdx, welfareInfo, manager);

    const response: ResponseInterface = { message: '복지포인트 사용내역 저장 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_WELFARES.PUT.API_OPERATION)
  @ApiParam(USERS_WELFARES.PUT.API_PARAM1)
  @ApiBody(USERS_WELFARES.PUT.API_BODY)
  @ApiOkResponse(USERS_WELFARES.PUT.API_OK_RESPONSE)
  @ApiForbiddenResponse(USERS_WELFARES.PUT.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_WELFARES.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor)
  @Put(':welfareIdx')
  async updateWelfare(
    @Param('welfareIdx', ParseIntPipe) welfareIdx: number,
    @Body() updateWelfareInfo: UpdateWelfareDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.welfareService.updateWelfare(userIdx, welfareIdx, updateWelfareInfo, manager);

    const response: ResponseInterface = { message: '복지포인트 사용내역 수정 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_WELFARES.DELETE.API_OPERATION)
  @ApiParam(USERS_WELFARES.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_WELFARES.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_WELFARES.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiForbiddenResponse(USERS_WELFARES.DELETE.API_FORBIDDEN_RESPONSE)
  @ApiNotFoundResponse(USERS_WELFARES.DELETE.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor)
  @Delete(':welfareIdx')
  async deleteWelfare(
    @Param('welfareIdx', ParseIntPipe) welfareIdx: number,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.welfareService.deleteWelfare(userIdx, welfareIdx, manager);

    const response: ResponseInterface = { message: '복지포인트 사용내역 초기화 성공', data: { targetDay } };

    return response;
  }
}
