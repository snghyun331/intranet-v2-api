import { SwaggerMethod } from '@common/interface/swagger.interface';

export const USERS_PLAYGROUND_LUNCH_GROUP: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 점심조 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '설정 직후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  sDate: '2025-05-10',
                  eDate: '2025-05-12',
                  total: 10,
                  perGroup: 3,
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groupInfo: [
                    {
                      groupNo: 1,
                      availMemberCount: 4,
                    },
                    {
                      groupNo: 2,
                      availMemberCount: 3,
                    },
                    {
                      groupNo: 3,
                      availMemberCount: 3,
                    },
                  ],
                  groups: {
                    '1': [],
                    '2': [],
                    '3': [],
                  },
                },
              },
            },
            b: {
              summary: '뽑기 후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  sDate: '2025-05-10',
                  eDate: '2025-05-12',
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groupInfo: [
                    {
                      groupNo: 1,
                      availMemberCount: 4,
                    },
                    {
                      groupNo: 2,
                      availMemberCount: 3,
                    },
                    {
                      groupNo: 3,
                      availMemberCount: 3,
                    },
                  ],
                  groups: {
                    '1': ['이승현', '신효은', '안지훈', '정진우'],
                    '2': ['김현민', '김단아', '김정현'],
                    '3': ['김현근', '이혜빈', '김선경'],
                  },
                  groupToAssign: '3',
                },
              },
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '점심조 뽑기 API',
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: 'success',
            data: {
              userName: '이승현',
              group: 4,
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
              summary: '이미 조에 배정',
              value: {
                message: '이미 조에 배정되었습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 12. 9. 오전 9:47:08',
                path: '/users/playground/lunch-group',
              },
            },
            b: {
              summary: '아직 설정 전',
              value: {
                message: '지금은 뽑기 가능 시간이 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 12. 9. 오전 9:48:33',
                path: '/users/playground/lunch-group',
              },
            },
            c: {
              summary: '정원 초과',
              value: {
                message: '배정 가능한 그룹이 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                path: '/users/playground/lunch-group',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_PLAYGROUND_LUNCH_GROUP: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '어드민 점심조 초기화 API',
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
      summary: '어드민 점심조 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '설정 직후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  sDate: '2025-05-10',
                  eDate: '2025-05-12',
                  total: 10,
                  perGroup: 3,
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groupInfo: [
                    {
                      groupNo: 1,
                      availMemberCount: 4,
                    },
                    {
                      groupNo: 2,
                      availMemberCount: 3,
                    },
                    {
                      groupNo: 3,
                      availMemberCount: 3,
                    },
                  ],
                  groups: {
                    '1': [],
                    '2': [],
                    '3': [],
                  },
                },
              },
            },
            b: {
              summary: '뽑기 후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  sDate: '2025-05-10',
                  eDate: '2025-05-12',
                  total: 10,
                  perGroup: 3,
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groupInfo: [
                    {
                      groupNo: 1,
                      availMemberCount: 4,
                    },
                    {
                      groupNo: 2,
                      availMemberCount: 3,
                    },
                    {
                      groupNo: 3,
                      availMemberCount: 3,
                    },
                  ],
                  groups: {
                    '1': ['이승현', '신효은', '안지훈', '정진우'],
                    '2': ['김현민', '김단아', '김정현'],
                    '3': ['김현근', '이혜빈', '김선경'],
                  },
                },
              },
            },
            c: {
              summary: '아직 설정X',
              value: {
                statusCode: 200,
                message: 'success',
                data: [],
              },
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '어드민 점심조 설정 API',
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
              summary: '점심조 만료 전에 또 생성',
              value: {
                message: '점심조 만료 시간이 지나지 않아 새로 생성할 수 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 12. 9. 오전 9:43:11',
                path: '/admin/playground/lunch-group',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_PLAYGROUND_MONTHLY_BAVERAGE: SwaggerMethod = {
  PUT: {
    API_OPERATION: {
      summary: '어드민 먼슬리 음료 수정 API',
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
      summary: '어드민 먼슬리 음료 현황 API',
    },
    API_QUERY1: {
      name: 'month',
      required: true,
      description: '월',
      example: '6',
      type: String,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '설정 없음',
              value: {
                statusCode: 200,
                message: 'success',
                data: null,
              },
            },
            b: {
              summary: '설정 있음',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  config: {
                    month: '6',
                    pickup: ['이승현', '김현민'],
                    dueDate: '2025-05-22',
                    configId: '682ff9eecc2782e690fbcc7f',
                  },
                  countStats: [
                    {
                      baverage: 'HOT 아메리카노',
                      count: 0,
                    },
                    {
                      baverage: 'ICE 아메리카노',
                      count: 0,
                    },
                    {
                      baverage: 'HOT 디카페인 아메리키노',
                      count: 0,
                    },
                    {
                      baverage: 'ICE 디카페인 아메리키노',
                      count: 0,
                    },
                    {
                      baverage: '바닐라 콜드브루',
                      count: 0,
                    },
                    {
                      baverage: 'ICE 자몽허니블랙티',
                      count: 0,
                    },
                    {
                      baverage: '선택안함',
                      count: 50,
                    },
                  ],
                  details: [
                    {
                      userName: '김현민',
                      baverage: null,
                    },
                    {
                      userName: '이승현',
                      baverage: null,
                    },
                    {
                      userName: '신효은',
                      baverage: null,
                    },
                    {
                      userName: '김현근',
                      baverage: null,
                    },
                    {
                      userName: '박민수',
                      baverage: null,
                    },
                    {
                      userName: '안지훈',
                      baverage: null,
                    },
                    {
                      userName: '김정현',
                      baverage: null,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '어드민 먼슬리 음료 설정 API',
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

export const USERS_PLAYGROUND_MONTHLY_BAVERAGE: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 먼슬리 음료 현황 API',
    },
    API_QUERY1: {
      name: 'month',
      required: true,
      description: '월',
      example: '6',
      type: String,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '설정 있음',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  config: {
                    month: '6',
                    pickup: ['이승현', '김현민'],
                    dueDate: '2025-05-22',
                    configId: '682e922174696d056f66f201',
                  },
                  details: [
                    {
                      userName: '김현민',
                      baverage: null,
                    },
                    {
                      userName: '이승현',
                      baverage: '바닐라크림 콜드브루',
                    },
                    {
                      userName: '신효은',
                      baverage: null,
                    },
                    {
                      userName: '김현근',
                      baverage: null,
                    },
                    {
                      userName: '박민수',
                      baverage: null,
                    },
                    {
                      userName: '안지훈',
                      baverage: null,
                    },
                    {
                      userName: '김정현',
                      baverage: null,
                    },
                  ],
                  myBaverage: '바닐라크림 콜드브루',
                },
              },
            },
            b: {
              summary: '설정 없음',
              value: {
                statusCode: 200,
                message: 'success',
                data: null,
              },
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '사용자 먼슬리 음료 신청 API',
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
