import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateActivityDto } from '../dto/createActivity.dto';
import { CreateActivityBudgetDto } from '../dto/createBudget.dto';
import { UpdateActivityDto } from '../dto/updateActivity.dto';
import { UpdateBudgetDto } from '../dto/updateBudget.dto';
import { UpdateConfirmDto } from '../dto/updateConfirm.dto';
import { UpdateNoteDto } from '../dto/updateNote.dto';

export const USERS_ACTIVITIES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '활동비 사용내역 등록 API',
    },
    API_BODY: {
      type: CreateActivityDto,
      examples: {
        a: {
          summary: '김현근',
          value: {
            targetDay: '2024-10-04',
            amount: 400000,
            content: '메드포갈릭',
            payerName: '김현근',
          },
          description: 'targetDay, amount, content, payerName 모두 필수 입력',
        },
        b: {
          summary: '박민수',
          value: {
            targetDay: '2024-10-04',
            amount: 400000,
            content: '메드포갈릭',
            payerName: '박민수',
          },
          description: 'targetDay, amount, content, payerName 모두 필수 입력',
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '활동비 사용내역 저장 성공',
            data: {
              targetDay: '2024-10-04',
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
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 22. 오전 11:36:01',
                path: '/users/activities',
              },
            },
            b: {
              summary: '활동비 승인 가능한 사람만 결제자 란에 기입',
              value: {
                message: '결제자 란에는 본부장 혹은 P&C 팀장만 기입할 수 있습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 22. 오전 11:40:27',
                path: '/users/activities',
              },
            },
            c: {
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/activities',
              },
            },
            d: {
              summary: '활동비 설정 없이 사용자가 등록을 시도할 때',
              value: {
                message: '아직 활동비를 작성할 수 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 12. 26. 오후 2:11:33',
                path: '/users/activities',
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
              summary: '활동비 등록할 권한 없음',
              value: {
                message: '권한이 없습니다.',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 10. 22. 오후 1:19:00',
                path: '/users/activities',
              },
              description: '팀장, 본부장, 대표만 등록 가능',
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '활동비 사용내역 수정 API',
    },
    API_PARAM1: {
      name: 'activityIdx',
      type: Number,
      required: true,
      description: '활동비 IDX',
    },
    API_BODY: {
      type: UpdateActivityDto,
      examples: {
        a: {
          summary: '활동비 내역 수정',
          value: {
            targetDay: '2024-11-05',
            amount: 400000,
            content: '메드포갈릭',
            payerName: '김현근',
          },
          description: 'targetDay, amount, content, payerName 수정 가능',
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '활동비 사용내역 수정 성공',
            data: {
              targetDay: '2024-10-05',
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
                path: '/users/activities/36',
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
              summary: '수정 권한 없음',
              value: {
                message: '권한이 없습니다.',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 10. 22. 오후 1:19:00',
                path: '/users/activities/1',
              },
              description: '팀장, 본부장, 대표만 수정 가능',
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
              summary: '결제자 이름을 잘못 입력 시',
              value: {
                message: '잘못된 결제자를 입력하였습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 22. 오전 11:36:01',
                path: '/users/activities',
              },
            },
            b: {
              summary: '활동비 승인 가능한 사람만 결제자 란에 기입',
              value: {
                message: '결제자 란에는 본부장 혹은 P&C 팀장만 기입할 수 있습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 22. 오전 11:40:27',
                path: '/users/activities',
              },
            },
            c: {
              summary: 'DB에 없는 userIdx',
              value: {
                message: '올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 9. 17. 오후 2:17:56',
                path: '/users/activities',
              },
            },
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '활동비 사용내역 초기화 API',
    },
    API_PARAM1: {
      name: 'activityIdx',
      type: Number,
      required: true,
      description: '활동비 IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '활동비 사용내역 초기화 성공',
            data: {
              targetDay: '2024-11-05',
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
                path: '/users/activities/36',
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
              summary: '활동비 삭제할 권한 없음',
              value: {
                message: '권한이 없습니다.',
                error: 'Forbidden',
                statusCode: 403,
                timeStamp: '2024. 10. 22. 오후 1:19:00',
                path: '/users/activities/1',
              },
              description: '팀장, 본부장, 대표만 삭제 가능',
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
                path: '/users/activities',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '활동비 사용내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: 'P&C팀 소속 (대표 포함)',
              value: {
                statusCode: 200,
                message: '활동비 사용내역 조회 성공',
                data: {
                  activityStats: {
                    year: '2024',
                    halfYear: 'H2',
                    activityBudget: 3833000,
                    activityExpense: 0,
                    activityBalance: 3833000,
                    hqName: null,
                    teamName: 'P&C',
                  },
                  activities: [
                    {
                      activityIdx: 10,
                      userIdx: 9,
                      userName: '윤이나',
                      targetDay: '2024-10-11',
                      content: '한강솥',
                      amount: 30000,
                      payerName: '윤이나',
                      confirmYN: 'N',
                    },
                  ],
                },
              },
              description:
                'userName은 활동비 내역 작성자를 뜻합니다. 작성자는 해당 본부(팀)의 본부장 및 팀장만 등록 가능합니다.',
            },
            b: {
              summary: 'HR 솔루션본부 소속',
              value: {
                statusCode: 200,
                message: '활동비 사용내역 조회 성공',
                data: {
                  activityStats: {
                    year: '2024',
                    halfYear: 'H2',
                    activityBudget: 3400000,
                    activityExpense: 640000,
                    activityBalance: 2760000,
                    hqName: 'HR솔류션본부',
                    teamName: null,
                  },
                  activities: [
                    {
                      activityIdx: 5,
                      userIdx: 8,
                      userName: '김현해',
                      targetDay: '2024-10-29',
                      content: '명륜진사갈비',
                      amount: 500000,
                      payerName: '김현근',
                      confirmYN: 'N',
                    },
                    {
                      activityIdx: 7,
                      userIdx: 7,
                      userName: '김현근',
                      targetDay: '2024-10-11',
                      content: '한강솥',
                      amount: 30000,
                      payerName: '김현근',
                      confirmYN: 'N',
                    },
                  ],
                },
              },
              description:
                'userName은 활동비 내역 작성자를 뜻합니다. 작성자는 해당 본부(팀)의 본부장 및 팀장만 등록 가능합니다.',
            },
            c: {
              summary: 'HR 컨설팅본부 소속',
              value: {
                statusCode: 200,
                message: '활동비 사용내역 조회 성공',
                data: {
                  activityStats: {
                    year: '2024',
                    halfYear: 'H2',
                    activityBudget: 3833000,
                    activityExpense: 800000,
                    activityBalance: 3033000,
                    hqName: 'HR컨설팅본부',
                    teamName: null,
                  },
                  activities: [
                    {
                      activityIdx: 8,
                      userIdx: 4,
                      userName: '박민수',
                      targetDay: '2024-10-07',
                      content: '메드포갈릭',
                      amount: 400000,
                      payerName: '박민수',
                      confirmYN: 'N',
                    },
                  ],
                },
              },
              description:
                'userName은 활동비 내역 작성자를 뜻합니다. 작성자는 해당 본부(팀)의 본부장 및 팀장만 등록 가능합니다.',
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
              summary: 'query param에 연도와 월 중, 하나만 입력했을 때',
              value: {
                message: '연도와 월은 모두 입력하거나, 모두 입력하지 않아야 합니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 10. 18. 오후 1:18:19',
                path: '/users/activities?year=2024',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_ACTIVITIES: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 활동비 내역 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 2,
              activity: [
                {
                  activityIdx: 29,
                  gradeName: '본부장',
                  teamName: 'P&C',
                  userIdx: 19,
                  userName: '김단아',
                  targetDay: '2025-04-02',
                  content: '커피가마시고싶구나',
                  amount: 20000,
                  payerName: '김단아',
                  confirmYN: 'N',
                  confirmDate: null,
                },
                {
                  activityIdx: 30,
                  gradeName: '본부장',
                  teamName: 'P&C',
                  userIdx: 19,
                  userName: '김단아',
                  targetDay: '2025-04-01',
                  content: '새로고침이슈',
                  amount: 40000,
                  payerName: '김단아',
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

export const ADMIN_ACTIVITIES_BUDGET: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 활동비 사용가능 금액 개별 수정 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'activityStatsIdx',
      required: true,
      description: '활동비 통계IDX',
    },
    API_BODY: {
      type: UpdateBudgetDto,
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            budgetPerMember: 200000,
            memberCount: 7,
            extraBudget: 10000,
            activityBudget: 1410000,
          },
        },
      },
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
              summary: '존재X',
              value: {
                message: '존재하지 않는 통계 내역입니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 12. 23. 오후 5:16:51',
                path: '/admin/activities/budget/9',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 활동비 설정 리스트 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '데이터 O',
              value: {
                statusCode: 200,
                message: 'success',
                data: [
                  {
                    activityStatsIdx: 6,
                    userIdx: 5,
                    userName: '김현근',
                    gradeName: '본부장',
                    activityBudget: 1400000,
                    note: null,
                    memberCount: 7,
                    budgetPerMember: 200000,
                    extraBudget: 0,
                  },
                ],
              },
            },
            b: {
              summary: '데이터 X',
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
      summary: '어드민 활동비 초기 설정 API',
    },
    API_BODY: {
      type: CreateActivityBudgetDto,
      required: true,
      examples: {
        a: {
          summary: '예시',
          value: {
            year: '2025',
            period: 'H1',
            userIdx: 1,
            memberCount: 7,
            budgetPerMember: 200000,
            activityBudget: 1400000,
          },
        },
      },
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
    API_CONFLICT_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '이미 등록한 경우',
              value: {
                message: '이미 새로 등록하였습니다.',
                error: 'Conflict',
                statusCode: 409,
                timeStamp: '2024. 12. 23. 오전 9:42:16',
                path: '/admin/activities/budget',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_ACTIVITIES_BUDGET_NOTE: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 활동비 비고 수정 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'activityStatsIdx',
      required: true,
      description: '활동비 통계IDX',
    },
    API_BODY: {
      type: UpdateNoteDto,
      required: true,
      examples: {
        a: {
          summary: '비고 내용 O',
          value: {
            note: '노트노트',
          },
        },
        b: {
          summary: '비고 내용 초기화',
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
              summary: '존재X',
              value: {
                message: '존재하지 않는 통계 내역입니다.',
                error: 'Not Found',
                statusCode: 404,
                timeStamp: '2024. 12. 23. 오후 5:29:34',
                path: '/admin/activities/budget/10/note',
              },
            },
          },
        },
      },
    },
  },
};

export const ADMIN_ACTIVITIES_CONFIRM: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 활동비 내역 확인 API',
    },
    API_PARAM1: {
      name: 'activityIdx',
      type: Number,
      required: true,
      description: '활동비IDX',
    },
    API_BODY: {
      type: UpdateConfirmDto,
      examples: {
        a: {
          summary: '확인 전',
          value: {
            activityIdxList: [1],
            confirmYN: 'N',
          },
        },
        b: {
          summary: '확인완료',
          value: {
            activityIdxList: [1, 2],
            confirmYN: 'Y',
          },
        },
        c: {
          summary: '반려',
          value: {
            activityIdxList: [1, 2],
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
            message: 'success',
          },
        },
      },
    },
  },
};

export const ADMIN_ACTIVITIES_BALANCES: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 활동비 정산완료 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '완료처리할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별 완료처리',
          value: { activityStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수 완료처리',
          value: { activityStatsIdxList: [1, 2, 3] },
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
                path: '/admin/activities/balances',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 활동비 정산 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              year: '2024',
              activityStats: [
                {
                  activityStatsIdx: 5,
                  year: '2025',
                  halfYear: 'H1',
                  userIdx: 5,
                  userName: '김현근',
                  gradeName: '본부장',
                  teamName: '-',
                  activityBudget: 200010,
                  activityExpense: 1627832,
                  activityBalance: -1427822,
                  totalOverpay: 1427822,
                  note: 'sdf',
                  clearStatus: 'complete',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const ADMIN_ACTIVITIES_BALANCES_CANCEL: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 활동비 정산완료 취소 처리 API',
    },
    API_BODY: {
      type: Array,
      description: '삭제할 통계내역IDX 배열',
      examples: {
        a: {
          summary: '통계내역IDX 개별삭제',
          value: { activityStatsIdxList: [1] },
        },
        b: {
          summary: '통계내역IDX 복수삭제',
          value: { activityStatsIdxList: [1, 2, 3] },
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
                path: '/admin/activitiess/balances/cancel',
              },
            },
          },
        },
      },
    },
  },
};
