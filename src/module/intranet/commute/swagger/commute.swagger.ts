import { SwaggerMethod } from '../../../../common/interface/swagger.interface';
import { StartWorkDto } from '../dto/startWork.dto';

export const USERS_INTRANET_CHECK_IN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '출근 찍기 API',
    },
    API_BODY: {
      type: StartWorkDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            checkInDeviceType: 'PC',
            commuteDate: '2025-01-13',
            startTime: '2025-01-13T07:16:15.759Z',
          },
        },
      },
      required: true,
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: 'success',
            data: {
              checkInTime: '2025-01-13T07:16:15.759Z',
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
              summary: '이미 출근 찍었다면',
              value: {
                message: '이미 출근이 등록되었습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 13. 오후 4:47:50',
                path: '/users/intranet/check-in',
              },
            },
          },
        },
      },
    },
  },
};
