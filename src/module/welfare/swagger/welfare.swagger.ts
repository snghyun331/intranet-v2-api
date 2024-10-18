import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';

export const USERS_WELFARES: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '전체/월별 복포 사용내역 조회 API',
      description: '복포 사용일 기준으로 내림차순 정렬됩니다. Query Param이 없으면 전체 데이터 조회로 검색됩니다.',
    },
    API_QUERY1: {
      name: 'year',
      type: String,
      description: '연도',
      required: false,
    },
    API_QUERY2: {
      name: 'month',
      type: String,
      description: '월(03,3 모두 가능)',
      required: false,
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
                welfareBudget: 200000,
                welfareExpense: 5500,
                welfareBalance: 194500,
                userName: '김현민',
              },
              welfares: [
                {
                  welfareIdx: 42,
                  userIdx: 2,
                  targetDay: '2024-11-05',
                  content: '스타벅스 용산점',
                  amount: 5500,
                  payerName: '김현민',
                  selfWrittenYN: 'Y',
                  payeeList: [],
                },
                {
                  welfareIdx: 39,
                  userIdx: 2,
                  targetDay: '2024-11-04',
                  content: '메가커피',
                  amount: null,
                  payerName: '이승현',
                  selfWrittenYN: 'N',
                  payeeList: [
                    {
                      userIdx: 2,
                      userName: '김현민',
                    },
                    {
                      userIdx: 3,
                      userName: '윤용설',
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      description: '현민님 로그인 기준',
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
          summary: '다른 사람 카드로 단독 결제',
          value: {
            targetDay: '2024-11-12',
            amount: 4500,
            content: '스타벅스',
            payerName: '김현민',
            payeeIdxs: [],
            selfWrittenYN: 'Y',
          },
        },
        d: {
          summary: '다른 사람 카드로 여러 명 결제',
          value: {
            targetDay: '2024-11-12',
            amount: 4500,
            content: '스타벅스',
            payerName: '김현민',
            payeeIdxs: [3],
            selfWrittenYN: 'Y',
          },
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
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 23. 오후 3:22:49',
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
                message: '해당 사용내역은 존재하지 않거나 삭제되었습니다.',
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
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 23. 오후 3:22:49',
                path: '/users/welfares/1',
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
                message: '해당 사용내역은 존재하지 않거나 삭제되었습니다.',
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
