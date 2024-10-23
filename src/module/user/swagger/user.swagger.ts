import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_IDXS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 사용자의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 사용자 IDX 조회 성공',
            data: [
              {
                userIdx: 1,
                userName: '이승현',
              },
              {
                userIdx: 2,
                userName: '김현민',
              },
              {
                userIdx: 3,
                userName: '이혜빈',
              },
            ],
          },
        },
      },
    },
  },
};

export const USERS_MY: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '로그인한 사용자 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '현재 로그인 되어있는 사용자 정보 조회 성공',
            data: {
              userIdx: 1,
              userName: '이승현',
              userGender: 'W',
              userCell: '010-4194-5718',
              userEmail: 'shlee1@acghr.co.kr',
              userBirth: '2000-03-31',
              joinDate: '2024-03-04',
              hqName: 'HR솔류션본부',
              teamName: 'HR Tech',
              gradeName: '위원',
              adminRole: 'Y',
            },
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          example: {
            message: '존재하지 않는 사용자입니다.',
            error: 'Not Found',
            statusCode: 404,
            timeStamp: '2024. 10. 23. 오후 2:38:32',
            path: '/users/me',
          },
        },
      },
    },
  },
};
