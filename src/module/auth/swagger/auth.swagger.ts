import { LoginUserDto } from '../dto/loginUser.dto';
import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const LOGIN: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '로그인 API',
    },
    API_BODY: {
      type: LoginUserDto,
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
