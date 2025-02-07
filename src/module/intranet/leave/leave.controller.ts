import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { ResponseInterface } from '../../../common/interface/response.interface';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { USERS_INTRANET_LEAVE } from './swagger/leave.swagger';
import { TransactionInterceptor } from '../../../common/interceptor/transaction.interceptor';
import { UserRoleGuard } from '../../auth/guard/roleGuard/userRole.guard';
import { UserRole } from '../../../common/decorator/role.decorator';
import { UserGradeEnum } from '../../../common/constant/enum';
import { UserAuthGuard } from '../../auth/guard/authGuard/userAuth.guard';
import { TransactionManager } from '../../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { CreateLeaveDto, LeaveRequestDto } from './dto/createLeave.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { leaveImageOptions } from '../../file/uploadMulter.options';
import { CurrentUserIdx } from '../../../common/decorator/currentUser.decorator';

@ApiTags('사용자')
@Controller('users/intranet')
export class UserLeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @ApiOperation(USERS_INTRANET_LEAVE.POST.API_OPERATION)
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse(USERS_INTRANET_LEAVE.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_INTRANET_LEAVE.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @UseInterceptors(TransactionInterceptor, FileInterceptor('leaveImage', leaveImageOptions))
  @Post('leave')
  async createLeave(
    @Body() { dto }: CreateLeaveDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
    @UploadedFile() leaveImage?: Express.Multer.File,
  ): Promise<ResponseInterface> {
    const parsedDto: LeaveRequestDto = dto as LeaveRequestDto;
    await this.leaveService.createLeave(parsedDto, userIdx, manager, leaveImage);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
