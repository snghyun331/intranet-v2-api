import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import * as moment from 'moment';
import { ResponseDto } from '../../common/dto/response.dto';
import { MealService } from './meal.service';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { USERS_MEALS } from './swagger/meal.swagger';
import { GetMealDto } from './dto/meal.dto';
import { CreateMealDto } from './dto/createMeal.dto';

@ApiTags('식대(USER)')
@Controller('users/meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @ApiOperation(USERS_MEALS.GET.API_OPERATION)
  @ApiQuery(USERS_MEALS.GET.API_QUERY1)
  @ApiQuery(USERS_MEALS.GET.API_QUERY2)
  @ApiOkResponse(USERS_MEALS.GET.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.GET.API_BAD_REQUEST_RESPONSE)
  @Get()
  async getMeal(
    @Query('year') year: string = moment().utcOffset(9).format('YYYY'),
    @Query('month') month: string = moment().utcOffset(9).format('MM'),
  ): Promise<ResponseDto> {
    const userIdx = 1;
    const yearToNum: number = Number(year);
    const monthToNum: number = Number(month);
    const meals: GetMealDto = await this.mealService.getMeal(yearToNum, monthToNum, userIdx);

    const response: ResponseDto = { message: '식대 사용내역 조회 성공', data: meals };

    return response;
  }

  @ApiOperation(USERS_MEALS.POST.API_OPERATION)
  @ApiBody(USERS_MEALS.POST.API_BODY)
  @ApiCreatedResponse(USERS_MEALS.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.POST.API_BAD_REQUEST_RESPONSE)
  @Post()
  async createMeal(@Body() mealInfo: CreateMealDto): Promise<ResponseDto> {
    const userIdx = 1;
    await this.mealService.createMeal(userIdx, mealInfo);

    const response: ResponseDto = { message: '식대 사용내역 저장 성공' };

    return response;
  }

  @ApiOperation(USERS_MEALS.DELETE.API_OPERATION)
  @ApiParam(USERS_MEALS.DELETE.API_PARAM1)
  @ApiOkResponse(USERS_MEALS.DELETE.API_OK_RESPONSE)
  @ApiBadRequestResponse(USERS_MEALS.DELETE.API_BAD_REQUEST_RESPONSE)
  @Delete(':mealIdx')
  async deleteMeal(@Param('mealIdx', ParseIntPipe) mealIdx: number): Promise<ResponseDto> {
    const userIdx = 1;
    await this.mealService.deleteMeal(userIdx, mealIdx);

    const response: ResponseDto = { message: '식대 사용내역 초기화 성공' };

    return response;
  }
}
