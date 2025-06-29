import { SwaggerMethod } from '@common/interface/swagger.interface';

export const USERS_NOTIFICATION_SMS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 SMS 발송 내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                smsMessageIdx: 2,
                toPhoneNumber: '010-4194-5718',
                status: 'SUCCESSED',
                sendAt: '2025-06-25T10:38:16.000Z',
                failureReason: null,
                fromPhoneNumber: '070-4915-5593',
                message: '짜잔',
                createdAt: '2025-06-25T10:38:15.955Z',
              },
            ],
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '사용자 SMS 발송 API',
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
