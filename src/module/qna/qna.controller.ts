import { Body, Controller, Delete, Get, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ResponseInterface } from '../../common/interface/response.interface';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_QNA, USERS_QNA } from './swagger/qna.swagger';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { QnaService } from './qna.service';
import { CreateQnaDto } from './dto/createQna.dto';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { QnaEntity } from '../../entity/qna/qna.entity';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { QnaAdminResult } from './interface/result.interface';
import { PaginationDto } from './dto/query.dto';

@ApiTags('문의(USER)')
@Controller('users/qna')
export class UserQnaController {
  constructor(private readonly qnaService: QnaService) {}

  @ApiOperation(USERS_QNA.POST.API_OPERATION)
  @ApiBody(USERS_QNA.POST.API_BODY)
  @ApiCreatedResponse(USERS_QNA.POST.API_CREATED_RESPONSE)
  @ApiBadRequestResponse(USERS_QNA.POST.API_BAD_REQUEST_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Post()
  async createQna(
    @Body() qnaInfo: CreateQnaDto,
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.qnaService.createQna(userIdx, qnaInfo, manager);

    const response: ResponseInterface = { message: '사용자 문의 내역 저장 성공' };

    return response;
  }

  @ApiOperation(USERS_QNA.GET.API_OPERATION)
  @ApiOkResponse(USERS_QNA.GET.API_OK_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Get()
  async getMyQna(@CurrentUserIdx() userIdx: number): Promise<ResponseInterface> {
    const myQnas: QnaEntity[] = await this.qnaService.getMyQna(userIdx);

    const response: ResponseInterface = { message: '로그인 사용자 문의 내역 조회 성공', data: myQnas };

    return response;
  }

  @Delete(':qnaIdx')
  async deleteMyQna() {}
}

@ApiTags('어드민')
@Controller('admin/qna')
export class AdminQnaController {
  constructor(private readonly qnaService: QnaService) {}

  @ApiOperation(ADMIN_QNA.GET.API_OPERATION)
  @ApiOkResponse(ADMIN_QNA.GET.API_OK_RESPONSE)
  @ApiForbiddenResponse(ADMIN_QNA.GET.API_FORBIDDEN_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, AdminRoleGuard)
  @Get()
  async getQna(@Query() paginationInfo: PaginationDto): Promise<ResponseInterface> {
    const { totalPage, total, qna }: QnaAdminResult = await this.qnaService.getQna(paginationInfo);

    const response: ResponseInterface = {
      message: '어드민 문의 내역 조회 성공',
      data: { totalPage, total, qna },
    };

    return response;
  }
}
