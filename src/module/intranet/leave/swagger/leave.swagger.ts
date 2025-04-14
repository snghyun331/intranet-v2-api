import { ApiBody } from '@nestjs/swagger';
import { SwaggerMethod } from '../../../../common/interface/swagger.interface';

export const USERS_INTRANET_LEAVE: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '사용자 개인 휴가 삭제 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'commuteIdx',
      required: true,
      description: 'IDX',
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
      summary: '사용자 개인 휴가 관리 조회 API',
    },
    API_QUERY1: {
      name: 'year',
      type: String,
      required: true,
      description: '회계연도',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              year: '2025',
              userIdx: 1,
              totalReceivedAnnualLeave: 15,
              totalAnnualLeaveUsage: 1,
              totalAnnualLeaveBalance: 14,
            },
          },
        },
      },
    },
  },
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

export const USERS_INTRANET_LEAVE_STATS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 개인 휴가관리 요약정보 조회 API 개발',
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
          examples: {
            a: {
              summary: '정상',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  leaveSummary: {
                    userIdx: 1,
                    userName: '김현민',
                    joinDate: '2023-03-04',
                    hqName: 'HR솔루션본부',
                    teamName: 'HR Tech',
                    gradeName: '본부장',
                    year: '2025',
                    totalReceivedAnnualLeave: 30,
                    totalAnnualLeaveUsage: 1,
                    yearsSinceJoin: 0,
                    oneYearAfterJoin: '2026-04-07',
                    totalAnnualLeaveBalance: 29,
                    notConfirmLeaveCount: 17,
                  },
                  leaveUsageStats: {
                    fullLeaveUsage: 1,
                    halfLeaveUsage: 0,
                    quarterLeaveUsage: 0,
                    specialLeaveUsage: 1.5,
                    alternativeLeaveUsage: 0,
                    sickLeaveUsage: 0,
                    trainingLeaveUsage: 0,
                    familyEventLeaveUsage: 0,
                    healthLeaveUsage: 0,
                    totalReceivedSpecialLeave: 10,
                    totalReceivedAlternativeLeave: 0,
                  },
                },
              },
            },
            b: {
              summary: '정보가 없을 떄',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  leaveSummary: {
                    userIdx: 1,
                    userName: '김현민',
                    joinDate: '2023-03-04',
                    hqName: 'HR솔루션본부',
                    teamName: 'HR Tech',
                    gradeName: '본부장',
                    year: '2023',
                    totalReceivedAnnualLeave: 0,
                    totalAnnualLeaveUsage: 0,
                    totalAnnualLeaveBalance: 0,
                    totalReceivedSpecialLeave: 0,
                    totalReceivedAlternativeLeave: 0,
                    yearsSinceJoin: 0,
                    oneYearAfterJoin: 0,
                    midJoinReceivedAnnualLeave: 0,
                    notConfirmLeaveCount: 0,
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
                    healthLeaveUsage: 0,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const USERS_INTRANET_LEAVE_DETAIL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 개인 휴가관리 상세정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                statusCode: 200,
                message: 'success',
                data: [
                  {
                    commuteIdx: 157,
                    userIdx: 2,
                    commuteDate: '2025-01-12',
                    commuteDayName: 'Sunday',
                    leaveTypeIdx: 3,
                    leaveType: '오후 반차',
                    imageIdx: 18,
                    imageName: 'proof.png',
                    imageSize: 12303,
                    imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/TEST/LEAVE/157/proof.png',
                    annualLeaveReduceUnit: 0.5,
                    note: null,
                    confirmYN: 'Y',
                    confirmDate: '2025-03-14',
                    rejectDate: null,
                    confirmPersonIdx: 5,
                    confirmPersonName: '김현근',
                    createdAt: '2025-03-14T06:24:45.256Z',
                    updatedAt: '2025-03-14T06:57:59.000Z',
                    approverInfo: [
                      {
                        approverIdx: 5,
                        approverName: '김현근',
                      },
                      {
                        approverIdx: 6,
                        approverName: '박민수',
                      },
                    ],
                    ccUserInfo: [],
                    confirmStatus: '2025-03-14',
                    remainingAnnualLeaveQuota: 29.5,
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
};

export const USERS_INTRANET_LEAVE_IMAGE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '사용자 개인 휴가 이미지 수정 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'commuteIdx',
      required: true,
      description: '휴가 신청 IDX',
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

export const UploadLeaveImage =
  (fileName = 'leaveImage'): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fileName]: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: false,
    })(target, propertyKey, descriptor);
  };

export const USERS_INTRANET_LEAVE_ALL_CALENDER: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '월별 전직원 휴가현황 조회 API',
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
            data: {
              '2025-02-04': [
                {
                  commuteIdx: 182,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-04',
                  leaveTypeIdx: 6,
                  leaveType: '연차',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'N',
                  createdAt: '2025-03-27T01:52:43.160Z',
                },
              ],
              '2025-02-14': [
                {
                  commuteIdx: 142,
                  userIdx: 2,
                  userName: '이승현',
                  commuteDate: '2025-02-14',
                  leaveTypeIdx: 6,
                  leaveType: '연차',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:44:52.331Z',
                },
              ],
              '2025-02-19': [
                {
                  commuteIdx: 150,
                  userIdx: 9,
                  userName: '김정현',
                  commuteDate: '2025-02-19',
                  leaveTypeIdx: 7,
                  leaveType: '특별 휴무',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'N',
                  createdAt: '2025-03-14T05:47:15.737Z',
                },
              ],
              '2025-02-23': [
                {
                  commuteIdx: 146,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-23',
                  leaveTypeIdx: 20,
                  leaveType: '병가',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:45:41.165Z',
                },
              ],
              '2025-02-24': [
                {
                  commuteIdx: 148,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-24',
                  leaveTypeIdx: 20,
                  leaveType: '병가',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:45:49.119Z',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_LEAVE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 연차 관리 총 연차일 수정 API',
    },
  },
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
              total: 6,
              summaries: [
                {
                  leaveStatsIdx: 3,
                  userIdx: 5,
                  userName: '김현근',
                  id: 'hkkim',
                  hqName: 'HR솔루션본부',
                  teamName: '-',
                  gradeName: '본부장',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 0,
                  totalAnnualLeaveBalance: 30,
                  note: null,
                },
                {
                  leaveStatsIdx: 1,
                  userIdx: 2,
                  userName: '이승현',
                  id: 'shlee1',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '본부장',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 2.25,
                  totalAnnualLeaveBalance: 27.75,
                  note: '',
                },
                {
                  leaveStatsIdx: 2,
                  userIdx: 1,
                  userName: '김현민',
                  id: 'hmkim',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '본부장',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 1.5,
                  totalAnnualLeaveBalance: 28.5,
                  note: null,
                },
                {
                  leaveStatsIdx: 5,
                  userIdx: 9,
                  userName: '김정현',
                  id: 'kjhyun',
                  hqName: 'HR솔루션본부',
                  teamName: 'HR Tech',
                  gradeName: '선임',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 0,
                  totalAnnualLeaveBalance: 30,
                  note: null,
                },
                {
                  leaveStatsIdx: 7,
                  userIdx: 19,
                  userName: '김단아',
                  id: 'dakim',
                  hqName: 'P&C',
                  teamName: 'P&C',
                  gradeName: '본부장',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 1.75,
                  totalAnnualLeaveBalance: 28.25,
                  note: null,
                },
                {
                  leaveStatsIdx: 4,
                  userIdx: 6,
                  userName: '박민수',
                  id: 'mspark',
                  hqName: 'HR컨설팅본부',
                  teamName: '-',
                  gradeName: '본부장',
                  year: '2025',
                  totalReceivedAnnualLeave: 30,
                  totalAnnualLeaveUsage: 0,
                  totalAnnualLeaveBalance: 30,
                  note: null,
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_LEAVE_STATS: SwaggerMethod = {
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

export const ADMIN_INTRANET_LEAVE_DETAIL: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '어드민 개인 휴가 내역 삭제 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'commuteIdx',
      required: true,
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
      summary: '어드민 사용자 휴가관리 상세정보 조회 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'userIdx',
      required: true,
      description: '사용자IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                commuteIdx: 148,
                userIdx: 1,
                commuteDate: '2025-02-24',
                commuteDayName: 'Monday',
                leaveTypeIdx: 20,
                leaveType: '병가',
                imageIdx: 28,
                imageName: 'proof.png',
                imageSize: 6239,
                imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/TEST/LEAVE/148/proof.png',
                annualLeaveReduceUnit: 0,
                note: null,
                confirmYN: 'Y',
                confirmDate: '2025-03-14',
                rejectDate: null,
                confirmPersonIdx: 5,
                confirmPersonName: '김현근',
                createdAt: '2025-03-14T05:45:49.119Z',
                updatedAt: '2025-03-14T05:48:48.000Z',
                approverInfo: [
                  {
                    approverIdx: 5,
                    approverName: '김현근',
                  },
                  {
                    approverIdx: 6,
                    approverName: '박민수',
                  },
                ],
                ccUserInfo: [],
                confirmStatus: '2025-03-14',
                remainingAnnualLeaveQuota: 30,
              },
            ],
          },
        },
      },
    },
  },
};

export const ADMIN_INTRANET_LEAVE_ALL_CALENDER: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 월별 전직원 휴가현황 조회 API',
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
            data: {
              '2025-02-04': [
                {
                  commuteIdx: 182,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-04',
                  leaveTypeIdx: 6,
                  leaveType: '연차',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'N',
                  createdAt: '2025-03-27T01:52:43.160Z',
                },
              ],
              '2025-02-14': [
                {
                  commuteIdx: 142,
                  userIdx: 2,
                  userName: '이승현',
                  commuteDate: '2025-02-14',
                  leaveTypeIdx: 6,
                  leaveType: '연차',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:44:52.331Z',
                },
              ],
              '2025-02-19': [
                {
                  commuteIdx: 150,
                  userIdx: 9,
                  userName: '김정현',
                  commuteDate: '2025-02-19',
                  leaveTypeIdx: 7,
                  leaveType: '특별 휴무',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'N',
                  createdAt: '2025-03-14T05:47:15.737Z',
                },
              ],
              '2025-02-23': [
                {
                  commuteIdx: 146,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-23',
                  leaveTypeIdx: 20,
                  leaveType: '병가',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:45:41.165Z',
                },
              ],
              '2025-02-24': [
                {
                  commuteIdx: 148,
                  userIdx: 1,
                  userName: '김현민',
                  commuteDate: '2025-02-24',
                  leaveTypeIdx: 20,
                  leaveType: '병가',
                  checkInTime: null,
                  checkOutTime: null,
                  confirmYN: 'Y',
                  createdAt: '2025-03-14T05:45:49.119Z',
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
      summary: '어드민 휴가 특이사항 수정 API',
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
