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

export const ADMIN_INTRANET_LEAVE: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 연차 관리 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 3,
              summaries: [
                {
                  userIdx: 2,
                  leaveStatsIdx: 1,
                  joinDate: '2024-03-04',
                  userName: '이승현',
                  userEmail: 'shlee1@acghr.co.kr',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  year: '2025',
                  totalReceivedAnnualLeave: 15,
                  totalAnnualLeaveUsage: 2,
                  totalAnnualLeaveBalance: 13,
                  note: null,
                  lastLeaveDate: '2025-01-05',
                },
                {
                  userIdx: 1,
                  leaveStatsIdx: 2,
                  joinDate: '2023-03-04',
                  userName: '김현민',
                  userEmail: 'hmkim@acghr.co.kr',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '선임',
                  year: '2025',
                  totalReceivedAnnualLeave: 15,
                  totalAnnualLeaveUsage: 1,
                  totalAnnualLeaveBalance: 14,
                  note: null,
                  lastLeaveDate: '2025-01-23',
                },
                {
                  userIdx: 4,
                  leaveStatsIdx: 3,
                  joinDate: '2010-05-09',
                  userName: '신효은',
                  userEmail: 'heshin@acghr.co.kr',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '책임',
                  year: '2025',
                  totalReceivedAnnualLeave: 15,
                  totalAnnualLeaveUsage: 3,
                  totalAnnualLeaveBalance: 12,
                  note: null,
                  lastLeaveDate: null,
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_LEAVE_NOTE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 연차 관리 특이사항 수정 API',
    },
    API_PARAM1: {
      name: 'leaveStatsIdx',
      type: Number,
      required: true,
      description: '연차관리IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            message: 'success',
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '잘못된 leaveStatsIdx',
              value: {
                message: '해당 내역은 존재하지 않거나 삭제되었습니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 10. 18. 오후 3:18:24',
                path: '/admin/intranet/leave/1',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_LEAVE_SUMMARY: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 사용자 휴가관리 요약정보 조회 API 개발',
    },
    API_PARAM1: {
      type: Number,
      name: 'userIdx',
      required: true,
      description: '사용자IDX',
    },
    API_QUERY1: {
      name: 'year',
      type: String,
      example: '2025',
      description: '회계연도',
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              leaveSummary: {
                userIdx: 2,
                userName: '이승현',
                year: '2025',
                joinDate: '2024-03-04',
                hqName: 'HR솔루션본부',
                teamName: 'HR Tech',
                gradeName: '위원',
                totalReceivedAnnualLeave: 15,
                totalAnnualLeaveUsage: 2,
                totalAnnualLeaveBalance: 13,
                midJoinReceivedAnnualLeave: 0,
                yearsSinceJoin: 0,
                oneYearAfterJoin: '2025-03-03',
              },
              leaveUsageStats: {
                fullLeaveUsage: 0,
                halfLeaveUsage: 0,
                quarterLeaveUsage: 0,
                specialLeaveUsage: 0,
                alternativeLeaveUsage: 0,
                sickLeaveUsage: 0,
                trainingLeaveUsage: 0,
                familyEventLeaveUsage: 0,
              },
            },
          },
        },
      },
    },
  },
};
