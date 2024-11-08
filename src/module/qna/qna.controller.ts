import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ResponseInterface } from '../../common/interface/response.interface';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ADMIN_QNA, USERS_QNA } from './swagger/qna.swagger';
import { UserGradeEnum } from '../../common/constant/enum';
import { UserRoleGuard } from '../auth/guard/roleGuard/userRole.guard';
import { UserAuthGuard } from '../auth/guard/authGuard/userAuth.guard';
import { UserRole } from '../../common/decorator/userRole.decorator';
import { CurrentUser, CurrentUserIdx } from '../../common/decorator/currentUser.decorator';
import { QnaService } from './qna.service';
import { CreateQnaDto } from './dto/createQna.dto';
import { TransactionInterceptor } from '../../common/interceptor/transaction.interceptor';
import { TransactionManager } from '../../common/decorator/transaction.decorator';
import { EntityManager } from 'typeorm';
import { QnaEntity } from '../../entity/qna/qna.entity';
import { AdminRoleGuard } from '../auth/guard/roleGuard/adminRole.guard';
import { QnaAdminResult } from './interface/result.interface';
import { PaginationDto } from './dto/query.dto';
import { UserPayload } from '../../common/interface/payload.interface';
import { ReplyQnaDto } from './dto/replyQna.dto';

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

  @ApiOperation(USERS_QNA.DELETE.API_OPERATION)
  @ApiBody(USERS_QNA.DELETE.API_BODY)
  @ApiOkResponse(USERS_QNA.DELETE.API_OK_RESPONSE)
  @ApiNotFoundResponse(USERS_QNA.DELETE.API_NOT_FOUND_RESPONSE)
  @ApiBadRequestResponse(USERS_QNA.DELETE.API_BAD_REQUEST_RESPONSE)
  @UseInterceptors(TransactionInterceptor)
  @ApiBearerAuth('accessToken')
  @UseGuards(UserAuthGuard, UserRoleGuard)
  @UserRole(UserGradeEnum.INTERN)
  @Delete()
  async deleteMyQna(
    @Body('qnaIdxList') qnaIdxList: number[],
    @CurrentUserIdx() userIdx: number,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.qnaService.deleteMyQna(userIdx, qnaIdxList, manager);

    const response: ResponseInterface = { message: '문의 내역 삭제 성공' };

    return response;
  }
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

  @ApiOperation(ADMIN_QNA.PATCH.API_OPERATION)
  @ApiParam(ADMIN_QNA.PATCH.API_PARAM1)
  @ApiBody(ADMIN_QNA.PATCH.API_BODY)
  @ApiOkResponse(ADMIN_QNA.PATCH.API_OK_RESPONSE)
  @ApiBadRequestResponse(ADMIN_QNA.PATCH.API_BAD_REQUEST_RESPONSE)
  @ApiNotFoundResponse(ADMIN_QNA.PATCH.API_NOT_FOUND_RESPONSE)
  @ApiBearerAuth('accessToken')
  @UseInterceptors(TransactionInterceptor)
  @UseGuards(UserAuthGuard, AdminRoleGuard)
  @Patch(':qnaIdx')
  async replyQna(
    @Param('qnaIdx', ParseIntPipe) qnaIdx: number,
    @Body() replyDto: ReplyQnaDto,
    @CurrentUser() admin: UserPayload,
    @TransactionManager() manager: EntityManager,
  ): Promise<ResponseInterface> {
    await this.qnaService.replyQna(qnaIdx, replyDto, admin, manager);

    const response: ResponseInterface = { message: '어드민 문의 답변 등록 성공' };

    return response;
  }
}
