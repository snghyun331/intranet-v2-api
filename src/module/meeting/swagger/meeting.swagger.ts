import { SwaggerMethod } from '@common/interface/swagger.interface';

export const USERS_MEETING: SwaggerMethod = {
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
            data: {
              meetingDate: '2025-06-29',
              rooms: [
                {
                  roomIdx: 1,
                  roomName: 'C_Room',
                  capacity: 5,
                  timeSlots: [
                    {
                      time: '08:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '08:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '09:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '09:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 6,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '09:30',
                        endTime: '10:30',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '10:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 6,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '09:30',
                        endTime: '10:30',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '10:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '11:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '11:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 7,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '11:30',
                        endTime: '12:00',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '12:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '12:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '13:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '13:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '14:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 8,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '14:00',
                        endTime: '15:00',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '14:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 8,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '14:00',
                        endTime: '15:00',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '15:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '15:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '16:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '16:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '17:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 9,
                        title: 'TECH 업무논의',
                        content: null,
                        startTime: '17:00',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '회의',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 19,
                            ccUserName: '김단아',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 1,
                            attendeeName: '김현민',
                          },
                          {
                            attendeeIdx: 2,
                            attendeeName: '이승현',
                          },
                          {
                            attendeeIdx: 4,
                            attendeeName: '신효은',
                          },
                          {
                            attendeeIdx: 14,
                            attendeeName: '이혜빈',
                          },
                        ],
                      },
                    },
                    {
                      time: '17:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '18:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '18:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '19:00',
                      isAvailable: true,
                      meeting: null,
                    },
                  ],
                },
                {
                  roomIdx: 2,
                  roomName: 'A_Room',
                  capacity: 10,
                  timeSlots: [
                    {
                      time: '08:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '08:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '09:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '09:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '10:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 10,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '10:00',
                        endTime: '10:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '10:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '11:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '11:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '12:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '12:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '13:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '13:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '14:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '14:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '15:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '15:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '16:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '16:30',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '17:00',
                      isAvailable: false,
                      meeting: {
                        reservationIdx: 11,
                        title: 'P&C 업무논의',
                        content: null,
                        startTime: '14:30',
                        endTime: '17:30',
                        meetingDate: '2025-06-29',
                        meetingType: '협력사미팅',
                        description: null,
                        writerName: '이승현',
                        ccUserInfo: [
                          {
                            ccUserIdx: 1,
                            ccUserName: '김현민',
                          },
                          {
                            ccUserIdx: 2,
                            ccUserName: '이승현',
                          },
                        ],
                        attendeeInfo: [
                          {
                            attendeeIdx: 8,
                            attendeeName: '안지훈',
                          },
                          {
                            attendeeIdx: 10,
                            attendeeName: '윤이나',
                          },
                          {
                            attendeeIdx: 19,
                            attendeeName: '김단아',
                          },
                        ],
                      },
                    },
                    {
                      time: '17:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '18:00',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '18:30',
                      isAvailable: true,
                      meeting: null,
                    },
                    {
                      time: '19:00',
                      isAvailable: true,
                      meeting: null,
                    },
                  ],
                },
              ],
            },
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
