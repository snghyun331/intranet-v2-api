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
          example: {
            statusCode: 201,
            message: 'success',
            data: {
              userName: '이승현',
              group: 4,
            },
          },
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

export const ADMIN_PLAYGROUND_LUNCH_GROUP: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 점심조 설정 API',
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
