import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { ResponseInterface } from '../../common/interface/response.interface';
import { DownloadService } from './download.service';
import { DOWNLOAD_MEALS, DOWNLOAD_MEALS_BALANCES } from './swagger/download.swagger';
import { DownloadMealBalanceDto, DownloadMealDto } from './dto/downloadMeal.dto';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @ApiTags('다운로드')
  @ApiExcludeEndpoint()
  @ApiOperation(DOWNLOAD_MEALS.POST.API_OPERATION)
  @ApiBody(DOWNLOAD_MEALS.POST.API_BODY)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Post('admin/meals')
  async downloadMealExcel(@Body() downloadInfo: DownloadMealDto): Promise<ResponseInterface> {
    await this.downloadService.downloadMealExcel(downloadInfo);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }

  @ApiTags('다운로드')
  @ApiOperation(DOWNLOAD_MEALS_BALANCES.POST.API_OPERATION)
  @ApiBody(DOWNLOAD_MEALS_BALANCES.POST.API_BODY)
  @ApiCreatedResponse(DOWNLOAD_MEALS_BALANCES.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @Post('admin/meals/balances')
  async downloadMealStatsExcel(@Body() downloadInfo: DownloadMealBalanceDto): Promise<ResponseInterface> {
    const path: string = await this.downloadService.downloadMealBalanceExcel(downloadInfo);

    const response: ResponseInterface = { message: 'success', data: { path } };

    return response;
  }
}
