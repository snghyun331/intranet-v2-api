import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions, OpenAPIObject } from '@nestjs/swagger';

const swaggerCustomOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
    defaultModelsExpandDepth: -1,
  },
};

export const setupSwagger = (app: INestApplication): void => {
  if (process.env.NODE_ENV === 'dev') {
    const options: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
      .setTitle('ACG 식대/복포 관리 서비스 API Docs')
      .setDescription('ACG BENEFIT-MANAGEMENT API Swagger 문서')
      .setVersion('2024')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'accessToken',
      )
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document, swaggerCustomOptions);
  }
};
