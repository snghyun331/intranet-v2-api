import { SwaggerMethod } from '../../../../common/interface/swagger.interface';

export const USERS_INTRANET_LEAVE: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '사용자 휴가 신청 API',
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
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '0000-00-00 형식으로',
              value: {
                message: 'commuteDate는 0000-00-00 날짜 형식으로 입력해주세요',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 28. 오후 3:44:37',
                path: '/users/intranet/leave',
              },
            },
            b: {
              summary: '올바르지 않는 휴가 유형',
              value: {
                message: '올바른 leaveType을 입력해주세요.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 28. 오후 3:38:31',
                path: '/users/intranet/leave',
              },
            },
          },
        },
      },
    },
  },
};
