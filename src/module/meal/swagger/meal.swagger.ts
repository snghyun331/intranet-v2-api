import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateMealDto } from '../dto/createMeal.dto';
import { UpdateMealDto } from '../dto/updateMeal.dto';

export const USERS_MEALS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '월별 식대 사용내역 조회 API',
      description:
        '식대 사용일 기준으로 내림차순 정렬됩니다. Query Param이 없으면 기본값으로 오늘의 연도와 월이 검색됩니다.',
    },
    API_QUERY1: {
      name: 'year',
      type: String,
      example: '2024',
      description: '연도',
      required: false,
    },
    API_QUERY2: {
      name: 'month',
      type: String,
      example: '10',
      description: '월(03,3 모두 가능)',
      required: false,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '식대 사용내역 조회 성공',
            data: {
              mealStats: {
                year: '2024',
                month: '10',
                mealBudget: 200000,
                mealExpense: 46000,
                mealBalance: 154000,
                userName: '이승현',
              },
              meals: [
                {
                  useDate: '2024-10-08',
                  mealsByDate: [
                    {
                      mealIdx: 5,
                      userIdx: 1,
                      holidayYN: 'N',
                      attendance: '근무',
                      mealType: 'launch',
                      dinerName: '포나',
                      payAmount: 13000,
                      payer: '이승현',
                    },
                  ],
                },
                {
                  useDate: '2024-10-04',
                  mealsByDate: [
                    {
                      mealIdx: 3,
                      userIdx: 1,
                      holidayYN: 'N',
                      attendance: '오후 반차',
                      mealType: null,
                      dinerName: null,
                      payAmount: 0,
                      payer: null,
                    },
                  ],
                },
                {
                  useDate: '2024-10-02',
                  mealsByDate: [
                    {
                      mealIdx: 2,
                      userIdx: 1,
                      holidayYN: 'N',
                      attendance: '근무',
                      mealType: 'launch',
                      dinerName: '김가네',
                      payAmount: 11000,
                      payer: '이승현',
                    },
                    {
                      mealIdx: 7,
                      userIdx: 1,
                      holidayYN: 'N',
                      attendance: '근무',
                      mealType: 'dinner',
                      dinerName: '서용관',
                      payAmount: 15000,
                      payer: '이승현',
                    },
                  ],
                },
              ],
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
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals',
              },
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '식대 사용내역 등록 API',
    },
    API_BODY: {
      type: CreateMealDto,
      examples: {
        a: {
          summary: '근무 & 식사 O',
          value: {
            useDate: '2024-09-18',
            attendance: '근무',
            mealType: 'launch',
            dinerName: '이여곰탕',
            payAmount: 11000,
            payer: '이승현',
          },
        },
        b: {
          summary: '근무 & 식사 X',
          value: {
            useDate: '2024-09-13',
            attendance: '근무',
          },
        },
        c: {
          summary: '휴무/반차 등일 때',
          value: {
            useDate: '2024-09-13',
            attendance: '오후 반차',
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '식대 사용내역 저장 성공',
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '휴일에 (재택)근무 외 다른 근무형태 선택 시',
              value: {
                message: '휴일에는 근무일 때만 등록할 수 있습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals',
              },
            },
            b: {
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals',
              },
            },
            c: {
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 23. 오후 3:22:49',
                path: '/users/meals',
              },
            },
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '식대 사용내역 초기화 API',
    },
    API_PARAM1: {
      name: 'mealIdx',
      type: Number,
      required: true,
      description: '식대 IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '식대 사용내역 초기화 성공',
          },
        },
      },
    },
    API_FORBIDDEN_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '삭제 권한 없음',
              value: {
                message: '식대 삭제 권한이 없습니다',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 9. 23. 오전 10:10:20',
                path: '/users/meals/4',
              },
              description: '로그인한 유저IDX와 meal작성자의 IDX가 일치하지 않음',
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
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals/4',
              },
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '식대 사용내역 수정 API',
    },
    API_PARAM1: {
      name: 'mealIdx',
      type: Number,
      required: true,
      description: '식대 IDX',
    },
    API_BODY: {
      type: UpdateMealDto,
      examples: {
        a: {
          summary: '모두 수정(useDate제외)',
          value: {
            attendance: '근무',
            mealType: 'launch',
            dinerName: '이여곰탕',
            payAmount: 11000,
            payer: '이승현',
          },
          description: 'useDate는 수정할 수 없습니다.',
        },
        b: {
          summary: '일부 수정',
          value: {
            payAmount: 9000,
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '식대 사용내역 수정 성공',
          },
        },
      },
    },
    API_FORBIDDEN_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '수정 권한 없음',
              value: {
                message: '식대 수정 권한이 없습니다',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 9. 23. 오전 10:10:20',
                path: '/users/meals/3',
              },
              description: '로그인한 유저IDX와 meal작성자의 IDX가 일치하지 않음',
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
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals/3',
              },
            },
            b: {
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 23. 오후 3:22:49',
                path: '/users/meals/3',
              },
            },
            c: {
              summary: '휴일에 (재택)근무 외 다른 근무형태 선택 시',
              value: {
                message: '휴일에는 근무일 때만 등록할 수 있습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals/3',
              },
            },
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '식대 존재X',
              value: {
                message: '해당 식대는 존재하지 않거나 삭제되었습니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 9. 23. 오후 4:26:49',
                path: '/users/meals/10',
              },
              description: 'mealIdx에 해당하는 식대가 없음',
            },
          },
        },
      },
    },
  },
};

export const USERS_MEALS_DETAIL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '식대 사용내역 상세조회 API',
    },
    API_PARAM1: {
      name: 'mealIdx',
      type: Number,
      required: true,
      description: '식대 IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '근무',
              value: {
                statusCode: 200,
                message: '식대 사용내역 상세조회 성공',
                data: {
                  mealIdx: 1,
                  userIdx: 1,
                  useDate: '2024-10-01',
                  holidayYN: 'Y',
                  attendance: '근무',
                  mealType: 'launch',
                  dinerName: '이여곰탕',
                  payAmount: 11000,
                  payer: '이승현',
                },
              },
            },
            b: {
              summary: '반차 or 휴무',
              value: {
                statusCode: 200,
                message: '식대 사용내역 상세조회 성공',
                data: {
                  mealIdx: 3,
                  userIdx: 1,
                  useDate: '2024-10-04',
                  holidayYN: 'N',
                  attendance: '오후 반차',
                  mealType: null,
                  dinerName: null,
                  payAmount: 0,
                  payer: null,
                },
              },
            },
          },
        },
      },
    },
    API_FORBIDDEN_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '조회 권한 없음',
              value: {
                message: '식대 조회 권한이 없습니다',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 9. 23. 오전 10:10:20',
                path: '/users/meals/2',
              },
              description: '로그인한 유저IDX와 meal작성자의 IDX가 일치하지 않음',
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
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/meals/2',
              },
            },
          },
        },
      },
    },
  },
};
