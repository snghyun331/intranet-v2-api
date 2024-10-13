import { Controller, Get, UseGuards } from '@nestjs/common';
import { ResponseDto } from '../../common/dto/response.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { USERS_IDXS } from './swagger/user.swagger';
import { UserService } from './user.service';
import { GetUserIdxDto } from './dto/getUserIdx.dto';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRolesGuard } from '../auth/guard/roleGuard/userRole.guard';

@ApiTags('사용자')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation(USERS_IDXS.GET.API_OPERATION)
  @ApiOkResponse(USERS_IDXS.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRolesGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get('ids')
  async getAllUserIdxs(): Promise<ResponseDto> {
    const userIdxInfo: GetUserIdxDto[] = await this.userService.getAllUserIdxInfo();

    const response: ResponseDto = { message: '모든 사용자 IDX 조회 성공', data: userIdxInfo };

    return response;
  }
}
