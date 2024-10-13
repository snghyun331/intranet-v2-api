import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const USERS_IDXS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 사용자의 IDX 정보를 조회하는 API',
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
