import { SwaggerMethod } from '../../../../common/interface/swagger.interface';

export const USERS_INTRANET_LEAVE: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '사용자 휴가 신청 API',
    },
    API_BODY: {},

    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {},
        },
      },
    },
  },
};
