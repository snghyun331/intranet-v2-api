import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_PLAYGROUND_LUNCH_GROUP: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 점심조 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {},
          },
        },
      },
    },
  },
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
  GET: {
    API_OPERATION: {
      summary: '어드민 점심조 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '설정 직후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  groups: {
                    '1': [],
                    '2': [],
                    '3': [],
                    '4': [],
                    '5': [],
                  },
                },
              },
            },
            b: {
              summary: '일부',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  groups: {
                    '1': ['김현민'],
                    '2': [],
                    '3': [],
                    '4': ['이승현'],
                    '5': [],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
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
