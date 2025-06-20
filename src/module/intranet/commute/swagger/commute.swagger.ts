import { SwaggerMethod } from '@common/interface/swagger.interface';
import { CheckInDto } from '../dto/checkIn.dto';
import { CheckOutDto } from '../dto/checkOut.dto';
import { UpdateCommuteTimeDto } from '../dto/updateCommuteTime.dto';
import { UpdateNoteDto } from '../dto/updateNote.dto';

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
            b: {
              summary: '연차/휴무일에 출근 찍었다면',
              value: {
                message: '오늘은 연차/휴무 날 입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 17. 오전 10:27:28',
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
            checkOutTime: '2025-01-13T09:16:15.759Z',
            earlyLeaveReason: null,
          },
        },
        b: {
          summary: '조기 퇴근',
          value: {
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
            c: {
              summary: '이미 퇴근을 찍었다면',
              value: {
                message: '이미 퇴근을 찍었습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 17. 오전 10:07:04',
                path: '/users/intranet/check-out',
              },
            },
          },
        },
      },
    },
  },
};

export const USERS_INTRAENT_COMMUTE: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '개인 출퇴근 내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 2,
              records: [
                {
                  commuteIdx: 129,
                  userIdx: 2,
                  commuteDate: '2025-02-18',
                  checkInTime: '2025-02-18T00:16:16.000Z',
                  checkOutTime: '2025-02-18T10:02:16.000Z',
                  workingMinutes: 585,
                  overtimeWorkingMinutes: 45,
                  attendance: '정상 퇴근',
                  leaveTypeIdx: 1,
                  leaveType: '근무',
                  updateReason: null,
                  earlyLeaveReason: null,
                  note: null,
                  checkInIpAddr: '172.18.0.1',
                  checkOutIpAddr: '172.18.0.1',
                  checkInLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  checkOutLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  createdAt: '2025-03-20T06:05:50.143Z',
                  updatedAt: '2025-03-20T06:05:55.000Z',
                },
                {
                  commuteIdx: 134,
                  userIdx: 2,
                  commuteDate: '2025-02-12',
                  checkInTime: null,
                  checkOutTime: null,
                  workingMinutes: null,
                  overtimeWorkingMinutes: null,
                  attendance: null,
                  leaveTypeIdx: 6,
                  leaveType: '연차',
                  updateReason: null,
                  earlyLeaveReason: null,
                  note: null,
                  checkInIpAddr: null,
                  checkOutIpAddr: null,
                  checkInLogAgent: null,
                  checkOutLogAgent: null,
                  createdAt: '2025-03-25T07:01:04.811Z',
                  updatedAt: '2025-03-25T07:01:04.811Z',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const USERS_INTRANET_COMMUTE_WORK_HOURS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 이번달 업무시간 조회(차트)',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              year: '2025',
              month: '3',
              weeklyWorkHours: [
                {
                  week: 1,
                  start: '2025-02-24',
                  end: '2025-03-02',
                  hours: 0,
                },
                {
                  week: 2,
                  start: '2025-03-03',
                  end: '2025-03-09',
                  hours: 9.98,
                },
                {
                  week: 3,
                  start: '2025-03-10',
                  end: '2025-03-16',
                  hours: 9.22,
                },
                {
                  week: 4,
                  start: '2025-03-17',
                  end: '2025-03-23',
                  hours: 9.22,
                },
                {
                  week: 5,
                  start: '2025-03-24',
                  end: '2025-03-30',
                  hours: 18.97,
                },
                {
                  week: 6,
                  start: '2025-03-31',
                  end: '2025-04-06',
                  hours: 0,
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_COMMUTE: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '어드민 출퇴근 내역 삭제 API',
    },
    API_BODY: {
      type: Array,
      description: '근태내역IDX 배열',
      examples: {
        a: {
          summary: '개별삭제',
          value: { commuteIdxList: [1] },
        },
        b: {
          summary: '복수삭제',
          value: { commuteIdxList: [1, 2, 3] },
        },
      },
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {},
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 출퇴근 관리 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 1,
              records: [
                {
                  commuteIdx: 3196,
                  userIdx: 2,
                  id: 'shlee1',
                  userName: '이승현',
                  teamName: 'HR Tech',
                  gradeName: '본부장',
                  commuteDate: '2025-06-16',
                  checkInTime: '2025-06-16T00:16:16.000Z',
                  checkOutTime: null,
                  workingMinutes: null,
                  overtimeWorkingMinutes: null,
                  attendance: '정상 출근',
                  updateReason: null,
                  earlyLeaveReason: null,
                  note: '야후.',
                  checkInIpAddr: '172.18.0.1',
                  checkOutIpAddr: null,
                  checkInLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                  checkOutLogAgent: null,
                  confirmDate: null,
                  rejectDate: null,
                  firstUpdatedAt: '2025-06-16T01:43:25.000Z',
                  lastUpdatedAt: {
                    name: '이승현',
                    time: '2025-06-16T03:00:39.543Z',
                  },
                  leave: [
                    {
                      commuteIdx: 3196,
                      leaveTypeIdx: 5,
                      leaveType: '오후 반반차',
                      confirmYN: 'N',
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
};

export const ADMIN_INTRANET_COMMUTE_TIME: SwaggerMethod = {
  PUT: {
    API_OPERATION: {
      summary: '어드민 출퇴근 시간 수정 API',
    },
    API_PARAM1: {
      name: 'commuteIdx',
      type: Number,
      required: true,
      description: '근태내역IDX',
    },
    API_BODY: {
      type: UpdateCommuteTimeDto,
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            checkInTime: '2025-01-22T00:16:15.759Z',
            checkOutTime: '2025-01-22T10:16:15.759Z',
            updateReason: '사유사유',
          },
        },
      },
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
};

export const ADMIN_INTRANET_COMMUTE_NOTE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 출퇴근 특이사항 수정 API',
    },
    API_PARAM1: {
      name: 'commuteIdx',
      type: Number,
      required: true,
      description: '근태내역IDX',
    },
    API_BODY: {
      type: UpdateNoteDto,
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            note: '특이사항입니다.',
            earlyLeaveReason: '조기퇴근사유입니다.',
            updateReason: '근태수정사유입니다..',
          },
        },
      },
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
};

export const USERS_INTRANET_HOLIDAY: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '월별 주말 및 공휴일 날짜 조회 API',
    },
    API_QUERY1: {
      type: String,
      name: 'year',
      required: true,
    },
    API_QUERY2: {
      type: String,
      name: 'month',
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              '2025-05-05',
              '2025-05-06',
              '2025-05-03',
              '2025-05-04',
              '2025-05-10',
              '2025-05-11',
              '2025-05-17',
              '2025-05-25',
              '2025-05-18',
              '2025-05-24',
              '2025-05-31',
            ],
          },
        },
      },
    },
  },
};

export const USER_INTRANET_COMMUTE_NOTE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '사용자 출퇴근 특이사항 수정 API',
    },
    API_PARAM1: {
      name: 'commuteIdx',
      type: Number,
      required: true,
      description: '근태내역IDX',
    },
    API_BODY: {
      type: UpdateNoteDto,
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            note: '특이사항입니다.',
            earlyLeaveReason: '조기퇴근사유입니다.',
            updateReason: '근태수정사유입니다..',
          },
        },
      },
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
};
