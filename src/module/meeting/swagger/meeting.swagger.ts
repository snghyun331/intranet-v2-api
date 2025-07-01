import { SwaggerMethod } from '@common/interface/swagger.interface';

export const USERS_MEETING: SwaggerMethod = {
  PUT: {
    API_OPERATION: {
      summary: '회의실 예약내역 수정하기 API',
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
  GET: {
    API_OPERATION: {
      summary: '회의실 스케줄 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                reservationIdx: 1,
                writerIdx: 2,
                writerName: '이승현',
                title: 'test',
                content: null,
                meetingDate: '2025-07-01',
                start: '2025-07-01T10:00:00',
                end: '2025-07-01T11:00:00',
                meetingType: '회의',
                roomId: 'R',
                description: null,
                attendeeInfo: [
                  {
                    attendeeIdx: 2,
                    attendeeName: '이승현',
                  },
                ],
                ccUserInfo: [
                  {
                    ccUserIdx: 1,
                    ccUserName: '김현민',
                  },
                  {
                    ccUserIdx: 19,
                    ccUserName: '김단아',
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '회의실 예약 내역 삭제 API',
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
