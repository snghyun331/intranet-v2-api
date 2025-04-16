import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { MockUserService } from './user.service.mock';
import { AdminRole } from '../../../common/decorator/role.decorator';
import { AdminAuthGuard } from '../../auth/guard/authGuard/adminAuth.guard';
import { AdminRoleGuard } from '../../auth/guard/roleGuard/adminRole.guard';
import { AdminGradeEnum } from '../../../common/constant/enum';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { AdminUserFilterDto } from '../dto/query.dto';
import { ResponseInterface } from '../../../common/interface/response.interface';
import { CreateUserDto } from '../dto/createUser.dto';
import { UpdateUserDto } from '../dto/updateUser.dto';

@Controller('admin/users')
export class MockAdminUserController {
  constructor(private readonly mockUserService: MockUserService) {}

  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get()
  async getAllUsersInfo(
    @Query() pageNoInfo: PageNoDto,
    @Query() filterInfo: AdminUserFilterDto,
  ): Promise<ResponseInterface> {
    const { totalPage, total, users } = await this.mockUserService.getAllUsersInfo(pageNoInfo, filterInfo);

    const response: ResponseInterface = { message: '모든 직원 정보 조회 성공', data: { totalPage, total, users } };

    return response;
  }

  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Post()
  async createUser(@Body() newUserInfo: CreateUserDto): Promise<ResponseInterface> {
    await this.mockUserService.createUser(newUserInfo);

    const response: ResponseInterface = { message: '새로운 유저 등록 성공' };

    return response;
  }

  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Get('check-login-id/:loginId')
  async checkLoginId(@Param('loginId') loginId: string): Promise<ResponseInterface> {
    const id: string = await this.mockUserService.checkIdIfAvailable(loginId);

    const response: ResponseInterface = { message: '아이디 중복확인 성공', data: { id } };

    return response;
  }

  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Put(':userIdx')
  async updateUser(
    @Param('userIdx', ParseIntPipe) userIdx: number,
    @Body() updateInfo: UpdateUserDto,
  ): Promise<ResponseInterface> {
    await this.mockUserService.updateUser(userIdx, updateInfo);

    const response: ResponseInterface = { message: '유저 정보 수정 성공' };

    return response;
  }

  @UseGuards(AdminAuthGuard, AdminRoleGuard)
  @AdminRole(AdminGradeEnum.NORMAL_ADMIN)
  @Delete(':userIdx')
  async deleteUser(@Param('userIdx', ParseIntPipe) userIdx: number): Promise<ResponseInterface> {
    await this.mockUserService.deleteUser(userIdx);

    const response: ResponseInterface = { message: 'success' };

    return response;
  }
}
