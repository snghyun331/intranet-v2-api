import { SwaggerMethod } from '@common/interface/swagger.interface';
import { UpdateNoticeDto } from '../dto/updateNotice.dto';

export const ADMIN_NOTICES: SwaggerMethod = {
  DELETE: {
    API_OPERATION: {
      summary: '어드민 공지사항 삭제 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'noticeIdx',
      description: '공지사항IDX',
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
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '존재하지 X',
              value: {
                message: '존재하지 않거나 삭제된 공지사항 입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 6. 오후 4:54:04',
                path: '/admin/notices/3',
              },
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '어드민 공지사항 수정 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'noticeIdx',
      description: '공지사항IDX',
      required: true,
    },
    API_BODY: {
      type: UpdateNoticeDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            title: '제목 10자 이내',
            content: '내용 글자 수 제한 없음',
            imageUrl: `https://acg-benefit.....`,
          },
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
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '존재하지 X',
              value: {
                message: '존재하지 않거나 삭제된 공지사항 입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 6. 오후 4:54:04',
                path: '/admin/notices/3',
              },
            },
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '어드민 공지사항 목록 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 1,
              notices: [
                {
                  noticeIdx: 2,
                  title: '제목 90자 이내',
                  creatorName: '이승현',
                  createdAt: '2025-01-06T06:41:40.000Z',
                },
              ],
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '공지사항 등록',
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

export const ADMIN_NOTICES_DETAIL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 공지사항 상세 조회 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'noticeIdx',
      description: '공지사항IDX',
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '이미지 O',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  noticeIdx: 14,
                  title: '[공지테스트]',
                  content: '야야',
                  creatorName: '이승',
                  lastEditorName: '이승',
                  imageIdx: 1,
                  imageName: 'server_rack.jpg',
                  imageSize: 52255,
                  imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/TEST/NOTICE/14/server_rack.jpg',
                  createdAt: '2025-01-14T07:21:56.039Z',
                  updatedAt: '2025-01-14T07:21:56.039Z',
                },
              },
            },
            b: {
              summary: '이미지 X',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  noticeIdx: 15,
                  title: '[공지테스트]',
                  content: '야야',
                  creatorName: '이승',
                  lastEditorName: '이승',
                  imageIdx: null,
                  imageName: null,
                  imageSize: null,
                  imageUrl: null,
                  createdAt: '2025-01-14T07:28:12.934Z',
                  updatedAt: '2025-01-14T07:28:12.934Z',
                },
              },
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
              summary: '존재하지 X',
              value: {
                message: '존재하지 않거나 삭제된 공지사항 입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 6. 오후 4:54:04',
                path: '/admin/notices/3',
              },
            },
          },
        },
      },
    },
  },
};

export const USERS_NOTICES: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 공지사항 목록 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              totalPage: 1,
              total: 1,
              notices: [
                {
                  noticeIdx: 2,
                  title: '제목 90자 이내',
                  creatorName: '이승현',
                  createdAt: '2025-01-06T06:41:40.000Z',
                },
              ],
            },
          },
        },
      },
    },
  },
};

export const USERS_NOTICES_DETAIL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 공지사항 상세 조회 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'noticeIdx',
      description: '공지사항IDX',
      required: true,
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: {
              noticeIdx: 2,
              title: '제목 90자 이내',
              content: '내용 글자 수 제한 없음',
              creatorName: '이승현',
              lastEditorName: '이승현',
              imageUrl: 'https://acg-benefit.....',
              createdAt: '2025-01-06T06:41:40.000Z',
              updatedAt: '2025-01-06T06:41:40.000Z',
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
              summary: '존재하지 X',
              value: {
                message: '존재하지 않거나 삭제된 공지사항 입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2025. 1. 6. 오후 4:54:04',
                path: '/admin/notices/3',
              },
            },
          },
        },
      },
    },
  },
};

export const USERS_NOTICES_HAS_NEW: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '사용자 공지사항 NEW 존재 확인 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '새로운 항목 없을 때',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  hasNew: false,
                },
              },
            },
            b: {
              summary: '새로운 항목 있을 때',
              value: {
                statusCode: 200,
                message: 'success',
                data: {
                  hasNew: true,
                },
              },
            },
          },
        },
      },
    },
  },
};
