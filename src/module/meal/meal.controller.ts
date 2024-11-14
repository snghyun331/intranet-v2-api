import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import * as moment from 'moment';
import { MealService } from './meal.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_MEALS, ADMIN_MEALS_BUDGET, USERS_MEALS } from './swagger/meal.swagger';
import { CreateMealDto } from './dto/createMeal.dto';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { EntityManager } from 'typeorm';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { ResponseInterface } from '../../common/interface/response.interface';
import { MealAdminResult, MealCalenderResult } from './interface/result.interface';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { AdminPaginationDto } from './dto/query.dto';
import { CreateMealBudgetDto } from './dto/createBudget.dto';

@ApiTags('식대(USER)')
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
    const yearToNum: number = Number(year);
    const monthToNum: number = Number(month);
    const meals: MealCalenderResult = await this.mealService.getMyMeal(yearToNum, monthToNum, userIdx);

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

@ApiTags('식대(ADMIN)')
@Controller('admin/meals')
export class AdminMealController {
  constructor(private readonly mealService: MealService) {}

  @ApiOperation(ADMIN_MEALS.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_MEALS.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_MEALS.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, AdminRoleGuard)
  @Get()
  async getQna(@Query() paginationInfo: AdminPaginationDto): Promise<ResponseInterface> {
    const { totalPage, total, meal }: MealAdminResult = await this.mealService.getMeal(paginationInfo);

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
  @UseGuards(UserAuthGuard, AdminRoleGuard)
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
}
