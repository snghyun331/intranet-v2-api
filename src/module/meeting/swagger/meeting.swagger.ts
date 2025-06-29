import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_MEETING: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '회의실 예약 내역 삭제하기 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '회의실 예약하기 API',
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
