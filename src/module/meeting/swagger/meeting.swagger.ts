import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_MEETING: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '회의실 예약하기 API',
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
