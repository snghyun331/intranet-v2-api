import { Body, Controller, Post } from '@nestjs/common';
import { WelfareService } from './welfare.service';
import { CreateWelfareDto } from './dto/createWelfare.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { ApiCreatedResponse, ApiOperation } from '@nestjs/swagger';
import { USERS_WELFARES } from './swagger/welfare.swagger';

@Controller('users/welfares')
export class WelfareController {
  constructor(private readonly welfareService: WelfareService) {}

  @ApiOperation(USERS_WELFARES.POST.API_OPERATION)
  @ApiCreatedResponse(USERS_WELFARES.POST.API_CREATED_RESPONSE)
  @Post()
  async createWelfare(@Body() welfareInfo: CreateWelfareDto): Promise<ResponseDto> {
    const userIdx = 1;
    await this.welfareService.createWelfare(userIdx, welfareInfo);

    const response: ResponseDto = { message: '복지포인트 사용내역 저장 성공' };

    return response;
  }
}
