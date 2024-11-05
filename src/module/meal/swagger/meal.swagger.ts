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
                mealBudget: 210000,
                mealExpense: 22000,
                mealBalance: 188000,
                userName: '이승현',
              },
              meals: [
                {
                  start: '2024-10-18',
                  holidayYN: 'N',
                  breakfast: {
                    payerName: '이승현',
                    place: '김가네',
                    amount: 6000,
                  },
                  lunch: {
                    payerName: '이승현',
                    place: '이여곰탕',
                    amount: 11000,
                    attendance: '근무',
                  },
                  dinner: {
                    payerName: '',
                    place: '',
                    amount: '',
                  },
                },
                {
                  start: '2024-10-19',
                  holidayYN: 'Y',
                  breakfast: {
                    payerName: '',
                    place: '',
                    amount: '',
                  },
                  lunch: {
                    payerName: '이승현',
                    place: '이여곰탕',
                    amount: 11000,
                    attendance: '근무',
                  },
                  dinner: {
                    payerName: '',
                    place: '',
                    amount: '',
                  },
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
            targetDay: '2024-10-29',
            attendance: '근무',
            breakfast: {
              payerName: '',
              place: '',
              amount: '',
            },
            lunch: {
              payerName: '이승현',
              place: '김가네',
              amount: 5000,
            },
            dinner: {
              payerName: '',
              place: '',
              amount: '',
            },
          },
        },
        b: {
          summary: '근무 & 식사 X',
          value: {
            targetDay: '2024-10-04',
            attendance: '근무',
            breakfast: {
              payerName: '',
              place: '',
              amount: '',
            },
            lunch: {
              payerName: '',
              place: '',
              amount: '',
            },
            dinner: {
              payerName: '',
              place: '',
              amount: '',
            },
          },
        },
        c: {
          summary: '휴무/반차 등일 때',
          value: {
            targetDay: '2024-10-29',
            attendance: '오후 반차',
            breakfast: {
              payerName: '',
              place: '',
              amount: '',
            },
            lunch: {
              payerName: '',
              place: '',
              amount: '',
            },
            dinner: {
              payerName: '',
              place: '',
              amount: '',
            },
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
            data: {
              targetDay: '2024-11-01',
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
              summary: '휴일에 근무 외 다른 근무형태 선택 시',
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
            d: {
              summary: '오후 반차는 모든 식대 X',
              value: {
                message: '오후 반차는 모든 식대 지원이 불가합니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 11. 오후 5:13:09',
                path: '/users/meals',
              },
            },
            e: {
              summary: '오전 반차는 조식, 중식 X',
              value: {
                message: '오전 반차일 때는 식대(조식, 중식) 지원이 불가합니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 11. 오후 5:13:09',
                path: '/users/meals',
              },
            },
            f: {
              summary: '연차/휴무 및 재택근무는 모든 식대 X',
              value: {
                message: '연차/휴무 및 재택 근무는 식대 지원이 불가합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 11. 오후 5:13:09',
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
      name: 'targetDay',
      type: String,
      required: true,
      description: '식대 사용일',
      example: '2024-10-07',
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
};
