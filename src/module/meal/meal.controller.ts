import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import * as moment from 'moment';
import { MealService } from './meal.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  ADMIN_MEALS,
  ADMIN_MEALS_BALANCES,
  ADMIN_MEALS_BALANCES_CANCEL,
  ADMIN_MEALS_BALANCES_DETAIL,
  ADMIN_MEALS_BUDGET,
  USERS_MEALS,
} from './swagger/meal.swagger';
import { CreateMealDto } from './dto/createMeal.dto';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { AdminRole, UserRole } from '../../common/decorator/role.decorator';
import { AdminGradeEnum, UserGradeEnum } from '../../common/constant/enum';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { EntityManager } from 'typeorm';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { MealAdminResult, MealBudgetAdminResult, MealCalenderResult } from './interface/result.interface';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { AdminMealBalanceFilterDto, AdminMealBudgetFilterDto, AdminMealFilterDto } from './dto/query.dto';
import { CreateMealBudgetDto } from './dto/createBudget.dto';
import { UpdateNoteDto } from './dto/updateNote.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { MealStatsAdminInfo } from './interface/meal.interface';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';
import { MealEntity } from '../../entity/meal/meal.entity';

@ApiTags('사용자')
@Controller('users/meals')
export class UserMealController {
  constructor(private readonly mealService: MealService) {}

  @ApiOperation(USERS_MEALS.GET.API_OPERATION)
  @ApiQuery(USERS_MEALS.GET.API_QUERY1)
  @ApiQuery(USERS_MEALS.GET.API_QUERY2)
  @ApiOkResponse(USERS_MEALS.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getMeal(
    @Query('year') year: string = moment().utcOffset(9).format('YYYY'),
    @Query('month') month: string = moment().utcOffset(9).format('MM'),
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseInterface> {
    const meals: MealCalenderResult = await this.mealService.getMyMeal(year, month, userIdx);

    const response: ResponseInterface = { message: '식대 사용내역 조회 성공', data: meals };

    return response;
  }

  @ApiOperation(USERS_MEALS.POST.API_OPERATION)
  @ApiBody(USERS_MEALS.POST.API_BODY)
  @ApiCreatedResponse(USERS_MEALS.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post()
  async createMeal(
    @Body() newMealInfo: CreateMealDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    const targetDay: string = await this.mealService.createMyMeal(userIdx, newMealInfo, manager);

    const response: ResponseInterface = { message: '식대 사용내역 저장 성공', data: { targetDay } };

    return response;
  }

  @ApiOperation(USERS_MEALS.DELETE.API_OPERATION)
  @ApiParam(USERS_MEALS.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_MEALS.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Delete(':targetDay')
  async deleteMeal(
    @Param('targetDay') targetDay: string,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.mealService.deleteMyMeal(userIdx, targetDay, manager);

    const response: ResponseInterface = { message: '식대 사용내역 초기화 성공' };

    return response;
  }
}

@ApiTags('어드민')
@Controller('admin/meals')
export class AdminMealController {
  constructor(private readonly mealService: MealService) {}

  @ApiOperation(ADMIN_MEALS.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_MEALS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getMeal(@Query() pageNoInfo: PageNoDto, @Query() filterInfo: AdminMealFilterDto): Promise<ResponseInterface> {
    const { totalPage, total, meal }: MealAdminResult = await this.mealService.getMeal(pageNoInfo, filterInfo);

    const response: ResponseInterface = {
      message: '어드민 식대 내역 조회 성공',
      data: { totalPage, total, meal },
    };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BUDGET.POST.API_OPERATION)
  @ApiBody(ADMIN_MEALS_BUDGET.POST.API_BODY)
  @ApiCreatedResponse(ADMIN_MEALS_BUDGET.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post('budget')
  async createMealBudget(
    @Body() mealBudgetInfo: CreateMealBudgetDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.mealService.createMealBudget(mealBudgetInfo, manager);

    const response: ResponseInterface = {
      message: '어드민 식대 설정 등록 및 수정 성공',
    };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BUDGET.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_MEALS_BUDGET.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('budget')
  async getMealBudget(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminMealBudgetFilterDto,
  ): Promise<ResponseInterface> {
    const { totalPage, total, workdays, mealBudget }: MealBudgetAdminResult = await this.mealService.getMealBudget(
      pageNoInfo,
      filterInfo,
    );
    const { month } = filterInfo;

    const response: ResponseInterface = {
      message: `${month}월 어드민 식대 설정 리스트 조회 성공`,
      data: { totalPage, total, workdays, mealBudget },
    };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BUDGET.PATCH.API_OPERATION)
  @ApiParam(ADMIN_MEALS_BUDGET.PATCH.API_PARAM1)
  @ApiBody(ADMIN_MEALS_BUDGET.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_MEALS_BUDGET.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_MEALS_BUDGET.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('budget/:mealStatsIdx')
  async updateMealStatsNote(
    @Param('mealStatsIdx', ParseIntPipe) mealStatsIdx: number,
    @Body() noteInfo: UpdateNoteDto,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.mealService.updateMealStatsNote(mealStatsIdx, noteInfo, manager);

    const response: ResponseInterface = { message: '비고 수정 성공' };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BALANCES.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_MEALS_BALANCES.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('balances')
  async getMealBalance(@Query() filterInfo: AdminMealBalanceFilterDto): Promise<ResponseInterface> {
    const mealStats: MealStatsAdminInfo[] = await this.mealService.getUserMealStats(filterInfo);

    const response: ResponseInterface = {
      message: `어드민 ${filterInfo.month}월 식대 정산 조회 성공`,
      data: { ...filterInfo, mealStats },
    };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BALANCES.PATCH.API_OPERATION)
  @ApiBody(ADMIN_MEALS_BALANCES.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_MEALS_BALANCES.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_MEALS_BALANCES.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('balances')
  async updateClearStatusComplete(
    @Body('mealStatsIdxList') mealStatsIdxList: number[],
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.mealService.updateClearStatusComplete(mealStatsIdxList, manager);

    const response: ResponseInterface = { message: '어드민 식대 정산완료 처리 성공' };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BALANCES_CANCEL.PATCH.API_OPERATION)
  @ApiBody(ADMIN_MEALS_BALANCES_CANCEL.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_MEALS_BALANCES_CANCEL.PATCH.API_OK_RESPONSE)
  @ApiNotFoundResponse(ADMIN_MEALS_BALANCES_CANCEL.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Patch('balances/cancel')
  async updateClearStatusNotYet(
    @Body('mealStatsIdxList') mealStatsIdxList: number[],
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.mealService.updateClearStatusNotYet(mealStatsIdxList, manager);

    const response: ResponseInterface = { message: '어드민 식대 정산완료 취소 처리 성공' };

    return response;
  }

  @ApiOperation(ADMIN_MEALS_BALANCES_DETAIL.GET.API_OPERATION)
  @ApiParam(ADMIN_MEALS_BALANCES_DETAIL.GET.API_PARAM1)
  @ApiOkResponse(ADMIN_MEALS_BALANCES_DETAIL.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('balances/:mealStatsIdx')
  async getMealBalanaceDetail(@Param('mealStatsIdx', ParseIntPipe) mealStatsIdx: number): Promise<ResponseInterface> {
    const data: MealEntity[] = await this.mealService.getMealBalanceDetail(mealStatsIdx);

    const response: ResponseInterface = { message: 'success', data };

    return response;
  }
}
