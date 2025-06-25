import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_NOTIFICATION_SMS: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '사용자 SMS 발송 API',
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
