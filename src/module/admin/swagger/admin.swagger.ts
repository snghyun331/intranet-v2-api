import { SwaggerMethod } from '../../../common/interface/swagger.interface';

export const ADMIN_GRADES_IDX: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 어드민 등급의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 직급 IDX 조회 성공',
            data: [
              {
                adminGradeIdx: 1,
                adminGradeName: '상위 관리자',
              },
              {
                adminGradeIdx: 2,
                adminGradeName: '일반 관리자',
              },
            ],
          },
        },
      },
    },
  },
};
