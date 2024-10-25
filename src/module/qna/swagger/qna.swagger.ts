import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateQnaDto } from '../dto/createQna.dto';

export const USERS_QNA: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '사용자 문의 등록 API',
    },
    API_BODY: {
      type: CreateQnaDto,
      examples: {
        a: {
          summary: '질문',
          value: {
            category: 'question',
            text: '질문',
          },
        },
        b: {
          summary: '버그',
          value: {
            category: 'bug',
            text: '버그',
          },
        },
        c: {
          summary: '제안',
          value: {
            category: 'proposal',
            text: '제안',
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '사용자 문의 내역 저장 성공',
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/qna',
              },
            },
          },
        },
      },
    },
  },
};
