import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import * as moment from 'moment';
import { ResponseDto } from '../../common/dto/response.dto';
import { MealService } from './meal.service';
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USERS_MEALS } from './swagger/meal.swagger';
import { GetMealCalenderDto } from './dto/meal.dto';
import { CreateMealDto } from './dto/createMeal.dto';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRolesGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { UpdateMealDto } from './dto/updateMeal.dto';

@ApiTags('식대(USER)')
@Controller('users/meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @ApiOperation(USERS_MEALS.GET.API_OPERATION)
  @ApiQuery(USERS_MEALS.GET.API_QUERY1)
  @ApiQuery(USERS_MEALS.GET.API_QUERY2)
  @ApiOkResponse(USERS_MEALS.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.GET.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getMeal(
    @Query('year') year: string = moment().utcOffset(9).format('YYYY'),
    @Query('month') month: string = moment().utcOffset(9).format('MM'),
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseDto> {
    const yearToNum: number = Number(year);
    const monthToNum: number = Number(month);
    const meals: GetMealCalenderDto = await this.mealService.getMeal(yearToNum, monthToNum, userIdx);

    const response: ResponseDto = { message: '식대 사용내역 조회 성공', data: meals };

    return response;
  }

  @ApiOperation(USERS_MEALS.POST.API_OPERATION)
  @ApiBody(USERS_MEALS.POST.API_BODY)
  @ApiCreatedResponse(USERS_MEALS.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post()
  async createMeal(@Body() newMealInfo: CreateMealDto, @CurrentUserIdx() userIdx: number): Promise<ResponseDto> {
    await this.mealService.createMeal(userIdx, newMealInfo);

    const response: ResponseDto = { message: '식대 사용내역 저장 성공' };

    return response;
  }

  @ApiOperation(USERS_MEALS.DELETE.API_OPERATION)
  @ApiParam(USERS_MEALS.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_MEALS.DELETE.API_OK_RESPONSE)
  @ApiForbiddenResponse(USERS_MEALS.DELETE.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.DELETE.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Delete(':mealIdx')
  async deleteMeal(
    @Param('mealIdx', ParseIntPipe) mealIdx: number,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseDto> {
    await this.mealService.deleteMeal(userIdx, mealIdx);

    const response: ResponseDto = { message: '식대 사용내역 초기화 성공' };

    return response;
  }

  // @ApiOperation(USERS_MEALS_DETAIL.GET.API_OPERATION)
  // @ApiParam(USERS_MEALS_DETAIL.GET.API_PARAM1)
  // @ApiOkResponse(USERS_MEALS_DETAIL.GET.API_OK_RESPONSE)
  // @ApiForbiddenResponse(USERS_MEALS_DETAIL.GET.API_FORBIDDEN_RESPONSE)
  // @ApiBadRequestResponse(USERS_MEALS_DETAIL.GET.API_BAD_REQUEST_RESPONSE)
  // @ApiBearerAuth('accessToken')
  // @UseGuards(UserAuthGuard, UserRolesGuard)
  // @UserRole(UserGradeEnum.INTERN)
  // @Get(':mealIdx')
  // async getMealDetail(
  //   @Param('mealIdx', ParseIntPipe) mealIdx: number,
  //   @CurrentUserIdx() userIdx: number,
  // ): Promise<ResponseDto> {
  //   const mealEntity: MealEntity = await this.mealService.getMealDetail(userIdx, mealIdx);

  //   const response: ResponseDto = { message: '식대 사용내역 상세조회 성공', data: mealEntity };

  //   return response;
  // }

  @ApiOperation(USERS_MEALS.PUT.API_OPERATION)
  @ApiParam(USERS_MEALS.PUT.API_PARAM1)
  @ApiBody(USERS_MEALS.PUT.API_BODY)
  @ApiOkResponse(USERS_MEALS.PUT.API_OK_RESPONSE)
  @ApiForbiddenResponse(USERS_MEALS.PUT.API_FORBIDDEN_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.PUT.API_BAD_REQUEST_RESPONSE)
  @ApiNotFoundResponse(USERS_MEALS.PUT.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Put(':mealIdx')
  async updateMeal(
    @Param('mealIdx', ParseIntPipe) mealIdx: number,
    @Body() updateMealInfo: UpdateMealDto,
    @CurrentUserIdx() userIdx: number,
  ): Promise<ResponseDto> {
    const targetDay: string = await this.mealService.updateMeal(userIdx, mealIdx, updateMealInfo);

    const response: ResponseDto = { message: '식대 사용내역 수정 성공', data: { targetDay } };

    return response;
  }
}
