import { ApiBody } from '@nestjs/swagger';
import { SwaggerMethod } from '../../../../common/interface/swagger.interface';

export const ADMIN_UPLOAD_NOTICE: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '어드민 공지사항 첨부파일(하나) 업로드 API',
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: 'success',
            data: {
              imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/NOTICE/2025-01-06/1864771.png',
            },
          },
        },
      },
    },
  },
};

export const UploadNoticeImageBody =
  (fileName = 'noticeImage'): MethodDecorator =>
  (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          [fileName]: {
            type: 'string',
            format: 'binary',
            description: 'jpg, jpeg, png, bmp, gif만 허용',
          },
        },
      },
      required: true,
    })(target, propertyKey, descriptor);
  };
