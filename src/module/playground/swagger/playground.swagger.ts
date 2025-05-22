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
                  sDate: '2024-12-09',
                  eDate: '2024-12-10',
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groups: {
                    '1': [],
                    '2': [],
                    '3': [],
                  },
                  groupToAssign: null,
                },
              },
            },
            b: {
              summary: '뽑기 후',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  sDate: '2024-12-09',
                  eDate: '2024-12-10',
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groups: {
                    '1': [],
                    '2': [],
                    '3': ['이승현'],
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
                  sDate: '2024-12-09',
                  eDate: '2024-12-10',
                  total: 5,
                  perGroup: 2,
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
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
                  sDate: '2025-03-05',
                  eDate: '2025-03-06',
                  total: 5,
                  perGroup: 2,
                  notice: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
                  groups: {
                    '1': ['신효은', '박민수', '이승현'],
                    '2': ['김현근', '정진우'],
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
  GET: {
    API_OPERATION: {
      summary: '어드민 먼슬리 음료 현황 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {},
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
