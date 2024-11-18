import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseInterface } from '../../common/interface/response.interface';
import { decryptPassword, encryptPassword } from '../../common/utils/utility';

@ApiTags('HEALTH CHECK')
@Controller('health')
export class HealthController {
  constructor() {}

  @Get()
  async checkHealth(): Promise<ResponseInterface> {
    const result: ResponseInterface = { message: 'Healthy!!' };
    return result;
  }

  @ApiQuery({ name: 'str' })
  @Get('encrypt')
  async testEncrypt(@Query('str') str: string): Promise<ResponseInterface> {
    const encryptedText = encryptPassword(str);
    const result: ResponseInterface = { message: 'success', data: encryptedText };
    return result;
  }

  @ApiQuery({ name: 'pw' })
  @Get('decrypt')
  async testDecrypt(@Query('pw') pw: string): Promise<ResponseInterface> {
    const decryptedText = decryptPassword(pw);
    const result: ResponseInterface = { message: 'success', data: decryptedText };

    return result;
  }
}
