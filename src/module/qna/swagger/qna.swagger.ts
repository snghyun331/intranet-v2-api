import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateQnaDto } from '../dto/createQna.dto';

export const USERS_QNA: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '현재 사용자 문의 등록 API',
    },
    API_BODY: {
      type: CreateQnaDto,
      examples: {
        a: {
          summary: '질문',
          value: {
            category: 'question',
            text: '질문',
          },
        },
        b: {
          summary: '버그',
          value: {
            category: 'bug',
            text: '버그',
          },
        },
        c: {
          summary: '제안',
          value: {
            category: 'proposal',
            text: '제안',
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '사용자 문의 내역 저장 성공',
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
                path: '/users/qna',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '현재 사용자 문의 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '로그인 사용자 문의 내역 조회 성공',
            data: [
              {
                qnaIdx: 1,
                userIdx: 1,
                category: 'question',
                text: '질문',
                replySuccessYN: 'N',
                replyText: null,
                replyAdmin: null,
                createdAt: '2024-10-25T04:18:00.370Z',
              },
            ],
          },
        },
      },
      description: 'createdAt은 UTC 기준입니다.',
    },
  },
};

export const ADMIN_QNA: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 전체 문의 내역 조회',
      description: '생성시간 기준으로 내림차순 정렬됩니다.',
    },
    API_QUERY1: {
      name: 'replySuccessYN',
      type: String,
      example: 'N',
      description: '답변 완료 여부',
      required: false,
    },
    API_QUERY2: {
      name: 'userCell',
      type: String,
      example: '010-4194-5718',
      description: '문의자 핸폰번호',
      required: false,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '어드민 문의 내역 조회 성공',
            data: {
              totalPage: 1,
              total: 5,
              qna: [
                {
                  qnaIdx: 5,
                  userIdx: 2,
                  userName: '김현민',
                  userCell: '010-6209-2023',
                  category: 'proposal',
                  text: '점심조 없애주세요',
                  replySuccessYN: 'N',
                  replyText: null,
                  replyAdmin: null,
                  createdAt: '2024-11-04T05:58:38.624Z',
                },
                {
                  qnaIdx: 4,
                  userIdx: 2,
                  userName: '김현민',
                  userCell: '010-6209-2023',
                  category: 'bug',
                  text: '버그 제보합니다',
                  replySuccessYN: 'N',
                  replyText: null,
                  replyAdmin: null,
                  createdAt: '2024-11-04T05:58:11.572Z',
                },
                {
                  qnaIdx: 3,
                  userIdx: 4,
                  userName: '박민수',
                  userCell: '010-2536-5474',
                  category: 'proposal',
                  text: '점심조 없애주세요',
                  replySuccessYN: 'N',
                  replyText: null,
                  replyAdmin: null,
                  createdAt: '2024-11-04T05:57:27.837Z',
                },
                {
                  qnaIdx: 2,
                  userIdx: 1,
                  userName: '이승현',
                  userCell: '010-4194-5718',
                  category: 'question',
                  text: '복포 버그 언제 수정되나요? 좀 불편하네요',
                  replySuccessYN: 'N',
                  replyText: null,
                  replyAdmin: null,
                  createdAt: '2024-11-04T05:55:29.036Z',
                },
                {
                  qnaIdx: 1,
                  userIdx: 1,
                  userName: '이승현',
                  userCell: '010-4194-5718',
                  category: 'question',
                  text: '질문',
                  replySuccessYN: 'N',
                  replyText: null,
                  replyAdmin: null,
                  createdAt: '2024-10-25T04:18:00.370Z',
                },
              ],
            },
          },
        },
      },
    },
    API_FORBIDDEN_RESPONSE: {
      content: {
        'application/json': {
          example: {
            message: '어드민 접근 권한이 없습니다.',
            error: 'Forbidden',
            statusCode: 403,
            timeStamp: '2024. 11. 4. 오후 1:29:20',
            path: '/admin/qna',
          },
        },
      },
    },
  },
};
