import { SwaggerMethod } from '../../../../common/interface/swagger.interface';
import { CheckInDto } from '../dto/checkIn.dto';
import { CheckOutDto } from '../dto/checkOut.dto';

export const USERS_INTRANET_CHECK_IN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '출근 찍기 API',
    },
    API_BODY: {
      type: CheckInDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            checkInDeviceType: 'PC',
            commuteDate: '2025-01-13',
            checkInTime: '2025-01-13T00:16:15.759Z',
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
              checkInTime: '2025-01-13T00:16:15.759Z',
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

export const USERS_INTRANET_CHECK_OUT: SwaggerMethod = {
  PUT: {
    API_OPERATION: {
      summary: '퇴근 찍기 API',
    },
    API_BODY: {
      type: CheckOutDto,
      examples: {
        a: {
          summary: '정상 퇴근',
          value: {
            checkOutDeviceType: 'PC',
            commuteDate: '2025-01-13',
            workHours: 9,
            checkOutTime: '2025-01-13T09:16:15.759Z',
            earlyLeaveReason: null,
          },
        },
        b: {
          summary: '조기 퇴근',
          value: {
            checkOutDeviceType: 'PC',
            commuteDate: '2025-01-13',
            workHours: 3,
            checkOutTime: '2025-01-13T04:16:15.759Z',
            earlyLeaveReason: '워크샵 조기퇴근',
          },
        },
      },
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              checkOutTime: '2025-01-13T09:16:15.759Z',
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
              summary: '출근 정보가 없다면',
              value: {
                message: '출근을 먼저 등록해주세요',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 13. 오후 4:47:50',
                path: '/users/intranet/check-out',
              },
            },
            b: {
              summary: '조기퇴근 시, 사유 입력 필수',
              value: {
                message: '근무시간이 9시간 미만일 경우, 조기 퇴근 사유이 필수입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 14. 오전 10:49:08',
                path: '/users/intranet/check-out',
              },
            },
          },
        },
      },
    },
  },
};
