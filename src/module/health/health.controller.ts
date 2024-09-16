import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseDto } from '../../common/dto/response.dto';

@ApiTags('HEALTH CHECK')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  async checkHealth(): Promise<ResponseDto> {
    const result: ResponseDto = { message: 'Healthy!!' };
    return result;
  }
}
