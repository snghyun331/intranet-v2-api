import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateMealDto } from '../dto/createMeal.dto';

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
      example: '3',
      description: '월(3,03 모두 가능)',
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
                month: '9',
                mealBudget: 180000,
                mealExpense: 13000,
                mealBalance: 167000,
                userName: '이승현',
              },
              meals: [
                {
                  useDate: '2024-09-12',
                  attendance: '근무',
                  dinerName: '파친코',
                  payAmount: 8000,
                  payer: '이승현',
                },
                {
                  useDate: '2024-09-11',
                  attendance: '근무',
                  dinerName: '김가네',
                  payAmount: 5000,
                  payer: '이승현',
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
              summary: 'DB에 없는 userId',
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
            useDate: '2024-09-13',
            attendance: '근무',
            mealType: 'launch',
            dinerName: '김가네',
            payAmount: 8000,
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
          summary: '휴무/반차 등일 떄',
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
              summary: 'DB에 없는 userId',
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
};
