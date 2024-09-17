import { Controller, Get, Query } from '@nestjs/common';
import * as moment from 'moment';
import { ResponseDto } from '../../common/dto/response.dto';
import { MealService } from './meal.service';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { USERS_MEALS } from './swagger/meal.swagger';
import { GetMealDto } from './dto/meal.dto';

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
}
