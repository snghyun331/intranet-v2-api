import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateWelfareDto } from '../dto/createWelfare.dto';
import { UpdateWelfareDto } from '../dto/updateWelfare.dto';

export const USERS_WELFARES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: ' 복지포인트 사용내역 등록 API',
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
            payeerIdxs: [2, 3],
          },
        },
        b: {
          summary: '본인 카드로 단독 결제',
          value: {
            targetDay: '2024-11-05',
            amount: 2500,
            content: '마린커피',
            payerName: '이승현',
            payeerIdxs: [],
          },
        },
        c: {
          summary: '다른 사람 카드로 단독 결제',
          value: {
            targetDay: '2024-11-12',
            amount: 4500,
            content: '스타벅스',
            payerName: '김현민',
            payeerIdxs: [],
          },
        },
        d: {
          summary: '다른 사람 카드로 여러 명 결제',
          value: {
            targetDay: '2024-11-12',
            amount: 4500,
            content: '스타벅스',
            payerName: '김현민',
            payeerIdxs: [3],
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
      summary: '복지포인트 사용내역 초기화 API (미완성)',
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
  },
  PUT: {
    API_OPERATION: {
      summary: '복지포인트 사용내역 수정 API(미완성)',
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
          summary: '모두 수정(targetDay 제외)',
          value: {
            amount: 3000,
            content: '와이브루',
            payerName: '이승현',
          },
          description: 'targetDay는 수정할 수 없습니다.',
        },
        b: {
          summary: '일부 수정',
          value: {
            payerName: '김현민',
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '복지포인트 사용내역 수정 성공',
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
  },
};
