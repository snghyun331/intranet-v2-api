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
                  totalAnnualLeave: 12,
                  annualLeaveBalance: 3,
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
                  totalAnnualLeave: 12,
                  annualLeaveBalance: 3,
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
                  totalAnnualLeave: 12,
                  annualLeaveBalance: 3,
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
