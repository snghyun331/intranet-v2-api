import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseInterface } from '../../common/interface/response.interface';

@ApiTags('HEALTH CHECK')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  async checkHealth(): Promise<ResponseInterface> {
    const result: ResponseInterface = { message: 'Healthy!!' };
    return result;
  }
}
