import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_WELFARES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '월별 복지포인트 사용내역 조회 API',
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '복지포인트 사용내역 저장 성공',
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '복지포인트 사용내역 초기화 API',
    },
    API_PARAM1: {
      name: 'welfareIdx',
      type: Number,
      required: true,
      description: '복포 IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '복지포인트 사용내역 초기화 성공',
          },
        },
      },
    },
  },
};
