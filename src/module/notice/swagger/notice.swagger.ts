import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateNoticeDto } from '../dto/createNotice.dto';

export const ADMIN_NOTICES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '공지사항 등록',
    },
    API_BODY: {
      type: CreateNoticeDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            title: '제목 100자 이내',
            content: '내용 글자 수 제한 없음',
            imageUrl: `https://acg-benefit.....`,
          },
        },
      },
      required: true,
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: 'success',
          },
        },
      },
    },
  },
};
