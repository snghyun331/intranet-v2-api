import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { DownloadMealDto } from '../dto/downloadMeal.dto';

export const DOWNLOAD_MEALS: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 식대 파일 다운로드 API',
    },
    API_BODY: {
      type: DownloadMealDto,
      description: '식대 다운로드 정보',
      examples: {
        a: {
          summary: '유저IDX 개별 다운',
          value: { year: '2024', month: '09', userIdxList: [1] },
        },
        b: {
          summary: '유저IDX 복수 다운',
          value: { year: '2024', month: '09', userIdxList: [1, 2, 3] },
        },
      },
      required: true,
    },
  },
};

export const DOWNLOAD_MEALS_BALANCES: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 식대 정산 파일 다운로드 API',
    },
    API_BODY: {
      type: DownloadMealDto,
      description: '식대 정산 다운로드 정보',
      examples: {
        a: {
          summary: '예시',
          value: { year: '2024', month: '09' },
        },
      },
      required: true,
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: 'success',
            data: {
              path: 'https://test-acg-playground.insahr.co.kr/resource/download/meal/ACG_식대정산_Template_2024년_11월.xlsx',
            },
          },
        },
      },
    },
  },
};
