import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_PLAYGROUND_LUNCH_GROUP: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '점심조 뽑기 API',
    },
    API_BODY: {
      type: String,
      examples: {
        a: {
          summary: '예시',
          value: {
            userName: '이승현',
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {},
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '올바르지 않은 유저이름',
              value: {},
            },
          },
        },
      },
    },
  },
};
