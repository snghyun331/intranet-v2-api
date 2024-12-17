import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateWelfareBudgetDto } from '../dto/createBudget.dto';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { UpdateConfirmDto } from '../dto/updateConfirm.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';

export const USERS_WELFARES: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '전체/월별 복포 사용내역 조회 API',
      description: '복포 사용일 기준으로 내림차순 정렬됩니다. Query Param이 없으면 전체 데이터 조회로 검색됩니다.',
    },

    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '복포 사용내역 조회 성공',
            data: {
              welfareStats: {
                year: '2024',
                halfYear: 'H2',
                welfareBudget: 190000,
                welfareExpense: 1005000,
                welfareBalance: -815000,
                userName: '이승현',
              },
              welfares: [
                {
                  welfareIdx: 55,
                  userIdx: 1,
                  targetDay: '2024-11-11',
                  content: '마린커피',
                  amount: 2500,
                  payerName: '이승현',
                  selfWrittenYN: 'Y',
                  confirmYN: 'Y',
                  payeeList: [],
                },
                {
                  welfareIdx: 52,
                  userIdx: 1,
                  targetDay: '2024-11-05',
                  content: '마린커피',
                  amount: 2500,
                  payerName: '이승현',
                  selfWrittenYN: 'Y',
                  confirmYN: 'Y',
                  payeeList: [
                    {
                      userIdx: 2,
                      userName: '김현민',
                      amount: 6000,
                    },
                    {
                      userIdx: 3,
                      userName: '운용',
                      amount: null,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      description: 'payee의 amount가 Null이면 미작성 상태를 의미',
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: 'query param에 연도와 월 중, 하나만 입력했을 때',
              value: {
                message: '연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 18. 오후 1:18:19',
                path: '/users/welfares?year=2024',
              },
            },
            b: {
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/welfares',
              },
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '복지포인트 사용내역 등록 API',
    },
    API_BODY: {
      type: CreateWelfareDto,
      examples: {
        a: {
          summary: '본인 카드로 여러 명 결제',
          value: {
            targetDay: '2024-11-05',
            amount: 2500,
            content: '마린커피',
            payerName: '이승현',
            payeeIdxs: [2, 3],
            selfWrittenYN: 'Y',
          },
        },
        b: {
          summary: '본인 카드로 단독 결제',
          value: {
            targetDay: '2024-11-05',
            amount: 2500,
            content: '마린커피',
            payerName: '이승현',
            payeeIdxs: [],
            selfWrittenYN: 'Y',
          },
        },
        c: {
          summary: '내 카드로 다른 사람이 결제',
          value: {
            targetDay: '2024-11-24',
            amount: 0,
            content: '아이파크몰 가족회관',
            payerName: '이승현',
            payeeIdxs: [2, 3],
            selfWrittenYN: 'Y',
          },
          description: '이승현 카드로 idx:2,3인 유저가 결제했다. 이 때, 이승현의 amount는 0',
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '복지포인트 사용내역 저장 성공',
            data: {
              targetDay: '2024-11-05',
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
                path: '/users/welfares',
              },
            },
            b: {
              summary: '결제자는 본인 이름만 기입',
              value: {
                message: '결제자는 본인 이름만 입력 가능합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 31. 오후 5:52:57',
                path: '/users/welfares',
              },
            },
            c: {
              summary: 'payee에 본인을 선택할 수 없음',
              value: {
                message: '동반 결제자에 본인을 선택할 수 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 8. 오후 2:27:18',
                path: '/users/welfares',
              },
            },
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '복지포인트 사용내역 초기화 API',
    },
    API_PARAM1: {
      name: 'welfareIdx',
      type: Number,
      required: true,
      description: '복포 IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '복지포인트 사용내역 초기화 성공',
            data: {
              targetDay: '2024-11-05',
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
                path: '/users/welfares/1',
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
              summary: '삭제 권한 없음',
              value: {
                message: '복포 삭제 권한이 없습니다',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 9. 23. 오전 10:10:20',
                path: '/users/welfares/1',
              },
              description: '로그인한 유저IDX와 welfare의 유저IDX가 일치하지 않음',
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
              summary: '존재하지 않는 내역',
              value: {
                message: '해당 내역은 존재하지 않거나 삭제되었습니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 10. 18. 오후 3:18:24',
                path: '/users/welfares/36',
              },
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '복지포인트 사용내역 수정 API',
    },
    API_PARAM1: {
      name: 'welfareIdx',
      type: Number,
      required: true,
      description: '복포 IDX',
    },
    API_BODY: {
      type: UpdateWelfareDto,
      examples: {
        a: {
          summary: '본인등록 복포 내역을 수정',
          value: {
            targetDay: '2024-11-05',
            amount: 2500,
            content: '마린커피',
            payerName: '이승현',
            payeeIdxs: [2, 3],
            selfWrittenYN: 'Y',
          },
          description: 'targetDay, amount, content, payerName, payeeIdxs 수정 가능',
        },
        b: {
          summary: '다른 사람 등록 복포 내역을 수정',
          value: {
            targetDay: '2024-11-05',
            amount: 2500,
            content: '마린커피',
            payerName: '이승현',
            payeeIdxs: [2, 3],
            selfWrittenYN: 'N',
          },
          description: 'amount만 수정 가능(targetDay, content, payerName, payeeIdxs는 고정',
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '복지포인트 사용내역 수정 성공',
            data: {
              targetDay: '2024-11-05',
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
              summary: '수정 권한 없음',
              value: {
                message: '식대 수정 권한이 없습니다',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 9. 23. 오전 10:10:20',
                path: '/users/welfares/1',
              },
              description: '로그인한 유저IDX와 welfare의 유저IDX가 일치하지 않음',
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
                path: '/users/welfares/1',
              },
            },
            b: {
              summary: '결제자는 본인 이름만 기입',
              value: {
                message: '결제자는 본인 이름만 입력 가능합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 31. 오후 5:52:57',
                path: '/users/welfares/1',
              },
            },
            c: {
              summary: 'payee에 본인을 선택할 수 없음',
              value: {
                message: '동반 결제자에 본인을 선택할 수 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 8. 오후 2:27:18',
                path: '/users/welfares',
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
              summary: '존재하지 않는 내역',
              value: {
                message: '해당 내역은 존재하지 않거나 삭제되었습니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 10. 18. 오전 11:01:56',
                path: '/users/welfares/60',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_WELFARES: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 복포 내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 복포 내역 조회 성공',
            data: {
              totalPage: 1,
              total: 4,
              welfare: [
                {
                  welfareIdx: 55,
                  userIdx: 1,
                  userName: '이승현',
                  gradeName: '위원',
                  targetDay: '2024-11-11',
                  content: '마린커피',
                  amount: 2500,
                  payerName: '이승현',
                  confirmYN: 'N',
                  confirmDate: null,
                },
                {
                  welfareIdx: 52,
                  userIdx: 1,
                  userName: '이승현',
                  gradeName: '위원',
                  targetDay: '2024-11-05',
                  content: '마린커피',
                  amount: 2500,
                  payerName: '이승현',
                  confirmYN: 'N',
                  confirmDate: null,
                },
                {
                  welfareIdx: 53,
                  userIdx: 2,
                  userName: '김현민',
                  gradeName: '위원',
                  targetDay: '2024-11-05',
                  content: '마린커피',
                  amount: null,
                  payerName: '이승현',
                  confirmYN: 'N',
                  confirmDate: null,
                },
                {
                  welfareIdx: 54,
                  userIdx: 3,
                  userName: '윤용설',
                  gradeName: '위원',
                  targetDay: '2024-11-05',
                  content: '마린커피',
                  amount: null,
                  payerName: '이승현',
                  confirmYN: 'N',
                  confirmDate: null,
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_WELFARES_CONFIRM: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 복포 내역 확인 API',
    },
    API_PARAM1: {
      name: 'welfareIdx',
      type: Number,
      required: true,
      description: '복포IDX',
    },
    API_BODY: {
      type: UpdateConfirmDto,
      examples: {
        a: {
          summary: '확인 전',
          value: {
            welfareIdxList: [1],
            confirmYN: 'N',
          },
        },
        b: {
          summary: '확인완료',
          value: {
            welfareIdxList: [1, 2],
            confirmYN: 'Y',
          },
        },
        c: {
          summary: '반려',
          value: {
            welfareIdxList: [1, 2],
            confirmYN: 'H',
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'Success',
          },
        },
      },
    },
  },
};

export const ADMIN_WELFARES_BUDGET: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 복포 설정 리스트 조회',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 복포 설정 리스트 조회 성공',
            data: [
              {
                welfareStatsIdx: 76,
                userIdx: 7,
                userName: '김현근',
                gradeName: '본부장',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 74,
                userIdx: 4,
                userName: '박민수',
                gradeName: '본부장',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 77,
                userIdx: 8,
                userName: '김현해',
                gradeName: '팀장',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 78,
                userIdx: 9,
                userName: '윤이나',
                gradeName: '팀장',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 72,
                userIdx: 2,
                userName: '김현민',
                gradeName: '위원',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 75,
                userIdx: 6,
                userName: '안지훈',
                gradeName: '위원',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 73,
                userIdx: 3,
                userName: '윤용설',
                gradeName: '위원',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 71,
                userIdx: 1,
                userName: '이승현',
                gradeName: '위원',
                welfareBudget: 190000,
                note: null,
              },
              {
                welfareStatsIdx: 79,
                userIdx: 10,
                userName: '장원영',
                gradeName: '인턴',
                welfareBudget: 300000,
                note: null,
              },
              {
                welfareStatsIdx: 80,
                userIdx: 11,
                userName: '장원영1',
                gradeName: '인턴',
                welfareBudget: 300000,
                note: null,
              },
            ],
          },
        },
      },
    },
  },
  PATCH: {
    API_OPERATION: {
      summary: '어드민 복포 설정 금액 개별 수정',
    },
    API_PARAM1: {
      name: 'welfareStatsIdx',
      description: '복포통계IDX',
      type: Number,
      required: true,
    },
    API_BODY: {
      type: Number,
      description: '수정할 총 사용가능금액',
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            welfareBudget: 230000,
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 복지포인트 총 사용가능 금액 개별 수정 성공',
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '어드민 복포 설정 일괄 등록 및 수정 API',
    },
    API_BODY: {
      type: CreateWelfareBudgetDto,
      examples: {
        a: {
          summary: '상반기',
          value: {
            period: 'H1',
            welfareBudget: 210000,
          },
        },
        b: {
          summary: '하반기',
          value: {
            period: 'H2',
            welfareBudget: 200000,
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '어드민 복지포인트 설정 일괄 등록 및 수정 성공',
          },
        },
      },
    },
  },
};

export const ADMIN_WELFARES_BUDGET_NOTE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 복포 설정 비고 수정 API',
    },
    API_PARAM1: {
      name: 'welfareStatsIdx',
      type: Number,
      required: true,
      description: '통계 IDX',
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
                path: '/admin/welfares/budget/37/note',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_WELFARES_BALANCES: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 복포 정산완료 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '완료처리할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별 완료처리',
          value: { welfareStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수 완료처리',
          value: { welfareStatsIdxList: [1, 2, 3] },
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
                path: '/admin/welfares/balances',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 복포 정산 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '정산 조회 성공',
            data: {
              year: '2024',
              welfareStats: [
                {
                  welfareStatsIdx: 77,
                  year: '2024',
                  halfYear: 'H1',
                  userIdx: 8,
                  userName: '김현해',
                  gradeName: '팀장',
                  welfareBudget: 300000,
                  welfareExpense: 0,
                  welfareBalance: 300000,
                  totalOverpay: 0,
                  note: null,
                  clearStatus: 'not_yet',
                },
                {
                  welfareStatsIdx: 78,
                  year: '2024',
                  halfYear: 'H1',
                  userIdx: 9,
                  userName: '윤이나',
                  gradeName: '팀장',
                  welfareBudget: 300000,
                  welfareExpense: 0,
                  welfareBalance: 300000,
                  totalOverpay: 0,
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

export const ADMIN_WELFARES_BALANCES_CANCEL: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 복포 정산완료 취소 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '삭제할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별삭제',
          value: { welfareStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수삭제',
          value: { welfareStatsIdxList: [1, 2, 3] },
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
                path: '/admin/welfares/balances/cancel',
              },
            },
          },
        },
      },
    },
  },
};
