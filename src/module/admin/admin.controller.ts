import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ResponseInterface } from '../../common/interface/response.interface';
import { AdminGradeEnum } from '../../common/constant/enum';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { ADMIN_GRADES_IDX } from './swagger/admin.swagger';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminRole } from '../../common/decorator/role.decorator';
import { AdminAuthGuard } from '../auth/guard/authGuard/adminAuth.guard';

@ApiTags('어드민')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation(ADMIN_GRADES_IDX.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_GRADES_IDX.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('gradeIds')
  async getAllAdminGradeIdxs(): Promise<ResponseInterface> {
    const gradeIdxInfo = await this.adminService.getAllAdminGradeIdxInfo();

    const response: ResponseInterface = { message: '모든 직급 IDX 조회 성공', data: gradeIdxInfo };

    return response;
  }
}
