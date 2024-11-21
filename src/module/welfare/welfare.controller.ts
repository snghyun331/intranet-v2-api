import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import {
  ADMIN_WELFARES,
  ADMIN_WELFARES_BUDGET,
  ADMIN_WELFARES_BUDGET_NOTE,
  USERS_WELFARES,
} from './swagger/welfare.swagger';
import { UpdateWelfareDto } from './dto/updateWelfare.dto';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { AdminRole, UserRole } from '../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { WelfareAdminResult, WelfareBudgetAdminResult, WelfareResult } from './interface/result.interface';
import { AdminWelfareBudgetFilterDto, AdminWelfareFilterDto, WelfareFilterDto } from './dto/query.dto';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { CreateWelfareBudgetDto } from './dto/createBudget.dto';
import { UpdateBudgetDto } from './dto/updateBudget.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';

@ApiTags('사용자')
@Controller('users/welfares')
export class UserWelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @ApiOperation(USERS_WELFARES.GET.API_OPERATION)
  @ApiOkResponse(USERS_WELFARES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getWelfare(@Query() query: WelfareFilterDto, @CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const welfares: WelfareResult = await this.welfareService.getMyWelfare(query.year, query.month, userIdx);

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
    const targetDay: string = await this.welfareService.createMyWelfare(userIdx, welfareInfo, manager);

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
    const targetDay: string = await this.welfareService.updateMyWelfare(
      userIdx,
      welfareIdx,
      updateWelfareInfo,
      manager,
    );

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
    const targetDay: string = await this.welfareService.deleteMyWelfare(userIdx, welfareIdx, manager);

    const response: ResponseInterface = { message: '복지포인트 사용내역 초기화 성공', data: { targetDay } };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/welfares')
export class AdminWelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @ApiOperation(ADMIN_WELFARES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_WELFARES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getWelfare(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminWelfareFilterDto,
  ): Promise<ResponseInterface> {
    const { totalPage, total, welfare }: WelfareAdminResult = await this.welfareService.getWelfare(
      pageNoInfo,
      filterInfo,
    );

    const response: ResponseInterface = { message: '어드민 복포 내역 조회 성공', data: { totalPage, total, welfare } };

    return response;
  }

  @ApiOperation(ADMIN_WELFARES_BUDGET.POST.API_OPERATION)
  @ApiBody(ADMIN_WELFARES_BUDGET.POST.API_BODY)
  @ApiCreatedResponse(ADMIN_WELFARES_BUDGET.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('budget')
  async createWelfareBudget(
    @Body() welfareBudgetInfo: CreateWelfareBudgetDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.welfareService.createWelfareBudget(welfareBudgetInfo, manager);

    const response: ResponseInterface = { message: '어드민 복지포인트 설정 일괄 등록 및 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_WELFARES_BUDGET.PATCH.API_OPERATION)
  @ApiParam(ADMIN_WELFARES_BUDGET.PATCH.API_PARAM1)
  @ApiBody(ADMIN_WELFARES_BUDGET.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_WELFARES_BUDGET.PATCH.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('budget/:welfareStatsIdx')
  async updateWelfareBudget(
    @Param('welfareStatsIdx', ParseIntPipe) welfareStatsIdx: number,
    @Body() { welfareBudget }: UpdateBudgetDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.welfareService.updateWelfareBudget(welfareStatsIdx, welfareBudget, manager);

    const response: ResponseInterface = { message: '어드민 복지포인트 총 사용가능 금액 개별 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_WELFARES_BUDGET.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_WELFARES_BUDGET.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('budget')
  async getWelfareBudget(@Query() filterInfo: AdminWelfareBudgetFilterDto): Promise<ResponseInterface> {
    const welfareBudget: WelfareBudgetAdminResult[] = await this.welfareService.getWelfareBudget(filterInfo);

    const response: ResponseInterface = { message: '어드민 복포 설정 리스트 조회 성공', data: welfareBudget };

    return response;
  }

  @ApiOperation(ADMIN_WELFARES_BUDGET_NOTE.PATCH.API_OPERATION)
  @ApiParam(ADMIN_WELFARES_BUDGET_NOTE.PATCH.API_PARAM1)
  @ApiOkResponse(ADMIN_WELFARES_BUDGET_NOTE.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_WELFARES_BUDGET_NOTE.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('budget/:welfareStatsIdx/note')
  async updateWelfareStatsNote(
    @Param('welfareStatsIdx', ParseIntPipe) welfareStatsIdx: number,
    @Body() noteInfo: UpdateNoteDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.welfareService.updateWelfareStatsNote(welfareStatsIdx, noteInfo, manager);

    const response: ResponseInterface = { message: '비고 수정 성공' };

    return response;
  }
}
