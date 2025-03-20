import { SwaggerMethod } from '../../../../common/interface/swagger.interface';
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
            checkInDeviceType: 'PC',
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
              total: 1,
              records: [
                {
                  commuteIdx: 101,
                  userIdx: 2,
                  commuteDate: '2025-02-24',
                  checkInTime: '2025-02-24T00:16:16.000Z',
                  checkOutTime: null,
                  workingMinutes: null,
                  overtimeWorkingMinutes: null,
                  attendance: '정상 출근',
                  leaveTypeIdx: 1,
                  leaveType: '근무',
                  updateReason: null,
                  earlyLeaveReason: null,
                  note: null,
                  checkInIpAddr: '172.18.0.1',
                  checkOutIpAddr: null,
                  checkInLogAgent: 'PC',
                  checkOutLogAgent: null,
                  createdAt: '2025-03-04T08:45:49.692Z',
                  updatedAt: '2025-03-04T08:45:49.692Z',
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
              total: 2,
              records: [
                {
                  commuteIdx: 72,
                  userIdx: 2,
                  id: 'shlee1',
                  userName: '이승현',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  checkInTime: '2025-02-24T02:16:16.000Z',
                  checkOutTime: '2025-02-24T09:16:16.000Z',
                  workingMinutes: 419,
                  overtimeWorkingMinutes: 0,
                  attendance: '조기 퇴근(지각)',
                  leaveTypeIdx: 1,
                  leaveType: '근무',
                  updateReason: null,
                  earlyLeaveReason: 'dp',
                  note: null,
                  checkInIpAddr: '172.18.0.1',
                  checkOutIpAddr: '172.18.0.1',
                  checkInLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  checkOutLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  confirmYN: 'N',
                  confirmDate: null,
                  createdAt: '2025-02-26T06:48:28.615Z',
                  updatedAt: '2025-02-26T06:48:34.000Z',
                },
                {
                  commuteIdx: 71,
                  userIdx: 2,
                  id: 'shlee1',
                  userName: '이승현',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  checkInTime: '2025-02-22T02:16:16.000Z',
                  checkOutTime: '2025-02-22T09:16:16.000Z',
                  workingMinutes: 419,
                  overtimeWorkingMinutes: 0,
                  attendance: '조기 퇴근',
                  leaveTypeIdx: 1,
                  leaveType: '근무',
                  updateReason: null,
                  earlyLeaveReason: 'dp',
                  note: null,
                  checkInIpAddr: '172.18.0.1',
                  checkOutIpAddr: '172.18.0.1',
                  checkInLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  checkOutLogAgent:
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
                  confirmYN: 'N',
                  confirmDate: null,
                  createdAt: '2025-02-26T06:48:00.439Z',
                  updatedAt: '2025-02-26T06:48:02.000Z',
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
