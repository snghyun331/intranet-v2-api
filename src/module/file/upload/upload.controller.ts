import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { ADMIN_UPLOAD_NOTICE, UploadNoticeImageBody } from './swagger/upload.swagger';
import { AdminRole } from '../../../common/decorator/role.decorator';
import { AdminGradeEnum } from '../../../common/constant/enum';
import { AdminAuthGuard } from '../../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../../auth/guard/roleGuard/adminRole.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { noticeImageOptions } from '../uploadMulter.options';
import { UploadImgDto } from './dto/uploadImgDto';

@ApiTags('업로드')
@Controller('upload/admin/notices')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation(ADMIN_UPLOAD_NOTICE.POST.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse(ADMIN_UPLOAD_NOTICE.POST.API_CREATED_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @UseInterceptors(FileInterceptor('noticeImage', noticeImageOptions))
  @UploadNoticeImageBody()
  @Post()
  async uploadNoticeImage(@UploadedFile() noticeImage: UploadImgDto): Promise<ResponseInterface> {
    const imageUrl: string = await this.uploadService.uploadNoticeImage(noticeImage);

    const response: ResponseInterface = { message: 'success', data: { imageUrl } };

    return response;
  }
}
