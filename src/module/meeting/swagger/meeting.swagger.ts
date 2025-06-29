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

export const USERS_MEETING_ROOM: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용가능한 회의실 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                roomIdx: 1,
                roomName: 'C_Room',
                capacity: 5,
                activeYN: 'Y',
              },
              {
                roomIdx: 2,
                roomName: 'A_Room',
                capacity: 10,
                activeYN: 'Y',
              },
              {
                roomIdx: 3,
                roomName: 'R_Room',
                capacity: 4,
                activeYN: 'Y',
              },
              {
                roomIdx: 4,
                roomName: 'C2_Room',
                capacity: 6,
                activeYN: 'Y',
              },
            ],
          },
        },
      },
    },
  },
};
