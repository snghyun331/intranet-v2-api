import { LoginDto } from '@auth/dto/login.dto';
import { SwaggerMethod } from '@common/interface/swagger.interface';

export const LOGIN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '로그인 API',
    },
    API_BODY: {
      type: LoginDto,
      examples: {
        a: {
          summary: '이승현',
          value: {
            id: 'shlee1',
            password: 'shlee12467',
          },
        },
        b: {
          summary: '김현민',
          value: {
            id: 'hmkim',
            password: 'hmkim2467',
          },
        },
        c: {
          summary: '윤용설',
          value: {
            id: 'ysyoon',
            password: 'ysyoon2467',
          },
        },
        d: {
          summary: '신효은',
          value: {
            id: 'heshin',
            password: 'heshin2467',
          },
        },
        e: {
          summary: '김현근',
          value: {
            id: 'hkkim',
            password: 'hkkim2467',
          },
        },
        f: {
          summary: '박민수',
          value: {
            id: 'mspark',
            password: 'mspark2467',
          },
        },
        g: {
          summary: '정진우',
          value: {
            id: 'jwjung',
            password: 'jwjung2467',
          },
        },
        h: {
          summary: '안지훈',
          value: {
            id: 'jhahn1',
            password: 'jhahn12467',
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '로그인 성공',
            data: {
              accessToken: 'eyJhbGciOiJIUzI1NiIsIn............',
              userIdx: 1,
              userName: '이숭현',
              userGender: 'W',
              userBirth: '2000-03-31',
              joinDate: '2024-03-04',
              hqName: 'HR솔루션본부',
              teamName: 'HR Tech',
              gradeName: '위원',
              adminRole: 'Y',
            },
          },
        },
      },
    },
    API_UNAUTHORIZED_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '로그인 실패 시',
              value: {
                message: '아이디 또는 비밀번호가 일치하지 않습니다.',
                error: 'Unauthorized',
                statusCode: 401,
                timeStamp: '2024. 9. 23. 오후 1:53:36',
                path: '/login',
              },
            },
          },
        },
      },
    },
  },
};

export const LOGOUT: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '로그아웃 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '로그아웃 성공',
            data: {
              userIdx: 1,
            },
          },
        },
      },
      description: '토큰 만료 시에도 로그아웃 가능',
    },
  },
};

export const LOGIN_ADMIN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 로그인 API',
    },
    API_BODY: {
      type: LoginDto,
      examples: {
        a: {
          summary: '이승현',
          value: {
            id: 'shlee1',
            password: 'shlee12467',
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '로그인 성공',
            data: {
              accessToken:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkeCI6MSwiYWRtaW5OYW1lIjoi7J207Iq57ZiEIiwiYWRtaW5FbWFpbCI6InNobGVlMUBhY2doci5jby5rciIsImFkbWluR3JhZGVOYW1lIjoi7IOB7JyEIOq0gOumrOyekCIsImhxTmFtZSI6bnVsbCwidGVhbU5hbWUiOm51bGwsImdyYWRlTmFtZSI6bnVsbCwiaWF0IjoxNzMyMjUxNjMyLCJleHAiOjE3MzI0MjQ0MzJ9.tPlaukX41t1NJxVMqVbb_x1u-iDRqfTG-OGYBIlnn6Y',
              adminIdx: 1,
              adminName: '이승현',
              adminEmail: 'shlee1@acghr.co.kr',
              adminGradeName: '상위 관리자',
              hqName: null,
              teamName: null,
              gradeName: null,
            },
          },
        },
      },
    },
    API_UNAUTHORIZED_RESPONSE: {},
  },
};

export const LOGOUT_ADMIN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 로그아웃 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '로그아웃 성공',
            data: {
              adminIdx: 1,
            },
          },
        },
      },
      description: '토큰 만료 시에도 로그아웃 가능',
    },
  },
};
