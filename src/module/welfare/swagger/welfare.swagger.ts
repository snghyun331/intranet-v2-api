import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_WELFARES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '월별 복지포인트 사용내역 조회 API',
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {},
        },
      },
    },
  },
};
