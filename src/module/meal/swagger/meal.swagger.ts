import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateMealBudgetDto } from '../dto/createBudget.dto';
import { CreateMealDto } from '../dto/createMeal.dto';
import { UpdateNoteDto } from '../dto/updateNote.dto';

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
                    amount: null,
                  },
                },
                {
                  start: '2024-10-19',
                  holidayYN: 'Y',
                  breakfast: {
                    payerName: '',
                    place: '',
                    amount: null,
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
                    amount: null,
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
              amount: null,
            },
            lunch: {
              payerName: '이승현',
              place: '김가네',
              amount: 5000,
            },
            dinner: {
              payerName: '',
              place: '',
              amount: null,
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
              amount: null,
            },
            lunch: {
              payerName: '',
              place: '',
              amount: null,
            },
            dinner: {
              payerName: '',
              place: '',
              amount: null,
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
              amount: null,
            },
            lunch: {
              payerName: '',
              place: '',
              amount: null,
            },
            dinner: {
              payerName: '',
              place: '',
              amount: null,
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
            g: {
              summary: '사용가능 금액 정보가 없을 경우',
              value: {
                message: '어드민에서 아직 사용가능금액 등록을 하지 않아, 식대 저장이 불가합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 14. 오후 1:21:13',
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

export const ADMIN_MEALS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 식대내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 식대 내역 조회 성공',
            data: {
              totalPage: 1,
              total: 2,
              meal: [
                {
                  mealIdx: 34,
                  gradeName: '위원',
                  userIdx: 1,
                  userName: '이승현',
                  place: '김가네',
                  targetDay: '2024-11-04',
                  mealType: 'lunch',
                  amount: 5000,
                  payerName: '이승현',
                  attendance: '근무',
                },
                {
                  mealIdx: 47,
                  gradeName: '위원',
                  userIdx: 2,
                  userName: '김현민',
                  place: '김가네',
                  targetDay: '2024-10-29',
                  mealType: 'lunch',
                  amount: 5000,
                  payerName: '이승현',
                  attendance: '근무',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_MEALS_BUDGET: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 식대 설정 등록 및 수정 API',
    },
    API_BODY: {
      type: CreateMealBudgetDto,
      examples: {
        a: {
          summary: '기본금액 및 총금액 설정',
          value: { baseAmount: 10000, mealBudget: 230000, year: '2024', month: '8' },
          description: '월은 1, 2 ... 포맷으로 입력해주세요(02 X). mealBudget은 기본식대 X 업무일 수 금액입니다.',
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '어드민 식대 사용가능 금액 설정 성공',
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 식대 설정 리스트 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '11월 어드민 식대 설정 리스트 조회 성공',
            data: {
              totalPage: 1,
              total: 8,
              workdays: 21,
              mealBudget: [
                {
                  mealStatsIdx: 177,
                  userIdx: 7,
                  userName: '김현근',
                  gradeName: '본부장',
                  mealBudget: 420000,
                  note: 'null',
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 175,
                  userIdx: 4,
                  userName: '박민수',
                  gradeName: '본부장',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 178,
                  userIdx: 8,
                  userName: '김현해',
                  gradeName: '팀장',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 179,
                  userIdx: 9,
                  userName: '윤이나',
                  gradeName: '팀장',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 173,
                  userIdx: 2,
                  userName: '김현민',
                  gradeName: '위원',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 176,
                  userIdx: 6,
                  userName: '안지훈',
                  gradeName: '위원',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 174,
                  userIdx: 3,
                  userName: '윤용설',
                  gradeName: '위원',
                  mealBudget: 420000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
                {
                  mealStatsIdx: 172,
                  userIdx: 1,
                  userName: '이승현',
                  gradeName: '위원',
                  mealBudget: 400000,
                  note: null,
                  year: '2024',
                  month: '11',
                },
              ],
            },
          },
        },
      },
      description: 'workdays: 월별 공식 업무일수',
    },
  },
  PATCH: {
    API_OPERATION: {
      summary: '어드민 식대 설정 비고 수정 API',
    },
    API_PARAM1: {
      name: 'mealStatsIdx',
      type: Number,
      required: true,
      description: '통계 IDX',
    },
    API_BODY: {
      type: UpdateNoteDto,
      examples: {
        a: {
          summary: '비고 내용 X',
          value: {
            note: '11월 22일 퇴사예정',
          },
        },
        b: {
          summary: '비고 내용 X (삭제)',
          value: {
            note: null,
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '비고 수정 성공',
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '존재하지 않는 내역',
              value: {
                message: '존재하지 않는 통계 내역입니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 11. 14. 오후 3:36:23',
                path: '/admin/meals/budget/4000',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_MEALS_BALANCES: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 식대 정산완료 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '완료처리할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별 완료처리',
          value: { mealStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수 완료처리',
          value: { mealStatsIdxList: [1, 2, 3] },
        },
      },
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 식대 정산완료 처리 성공',
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '존재하지 않는 내역',
              value: {
                message: '존재하지 않는 통계 내역입니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 11. 14. 오후 3:36:23',
                path: '/admin/meals/balances',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 식대 정산 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 11월 식대 정산 조회 성공',
            data: {
              year: '2024',
              month: '11',
              mealStats: [
                {
                  mealStatsIdx: 172,
                  userIdx: 1,
                  userName: '이승현',
                  gradeName: '대표',
                  mealBudget: 400000,
                  mealExpense: 0,
                  mealBalance: 400000,
                  breakfastExpense: 0,
                  dinnerExpense: 0,
                  breakfastOverpay: 0,
                  dinnerOverpay: 0,
                  mealOverpay: 0,
                  totalOverpay: 0,
                  workdays: 21,
                  holidays: 9,
                  timeoffDays: 1,
                  holidayWorkdays: 1,
                  note: null,
                  clearStatus: 'not_yet',
                },
                {
                  mealStatsIdx: 173,
                  userIdx: 2,
                  userName: '김현민',
                  gradeName: '위원',
                  mealBudget: 440000,
                  mealExpense: 530000,
                  mealBalance: -90000,
                  breakfastExpense: 33000,
                  dinnerExpense: 22000,
                  breakfastOverpay: 6000,
                  dinnerOverpay: 2000,
                  mealOverpay: -90000,
                  totalOverpay: 8000,
                  workdays: 21,
                  holidays: 9,
                  timeoffDays: 1,
                  holidayWorkdays: 1,
                  note: null,
                  clearStatus: 'not_yet',
                },
                {
                  mealStatsIdx: 176,
                  userIdx: 6,
                  userName: '안지훈',
                  gradeName: '위원',
                  mealBudget: 420000,
                  mealExpense: 0,
                  mealBalance: 420000,
                  breakfastExpense: 0,
                  dinnerExpense: 0,
                  breakfastOverpay: 0,
                  dinnerOverpay: 0,
                  mealOverpay: 0,
                  totalOverpay: 0,
                  workdays: 21,
                  holidays: 9,
                  timeoffDays: 1,
                  holidayWorkdays: 1,
                  note: null,
                  clearStatus: 'not_yet',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_MEALS_BALANCES_CANCEL: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 식대 정산완료 취소 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '삭제할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별삭제',
          value: { mealStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수삭제',
          value: { mealStatsIdxList: [1, 2, 3] },
        },
      },
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 식대 정산완료 취소 처리 성공',
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '존재하지 않는 내역',
              value: {
                message: '존재하지 않는 통계 내역입니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 11. 14. 오후 3:36:23',
                path: '/admin/meals/budget/4000',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_MEALS_BALANCES_DETAIL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 식대 정산 상세조회 API',
    },
    API_PARAM1: {
      name: 'mealStatsIdx',
      type: Number,
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                targetDay: '2024-11-03',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-03',
                mealType: 'breakfast',
                place: '삼첨당',
                amount: 9000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-03',
                mealType: 'dinner',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-04',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-04',
                mealType: 'breakfast',
                place: '삼첨당',
                amount: 12000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-04',
                mealType: 'dinner',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-05',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-05',
                mealType: 'breakfast',
                place: '삼첨당',
                amount: 12000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-05',
                mealType: 'dinner',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-18',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-18',
                mealType: 'breakfast',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-18',
                mealType: 'dinner',
                place: '삼첨당',
                amount: 13000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-19',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-19',
                mealType: 'breakfast',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-19',
                mealType: 'dinner',
                place: '삼첨당',
                amount: 9000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-21',
                mealType: 'lunch',
                place: '김가네',
                amount: 5000,
                payerName: '이승현',
              },
              {
                targetDay: '2024-11-21',
                mealType: 'breakfast',
                place: '',
                amount: null,
                payerName: '',
              },
              {
                targetDay: '2024-11-21',
                mealType: 'dinner',
                place: '',
                amount: null,
                payerName: '',
              },
            ],
          },
        },
      },
    },
  },
};
