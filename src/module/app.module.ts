import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { LoggerMiddleware } from 'src/common/middleware/logger.middleware';
import { DATABASE_CONFIG } from 'src/config/database.config';
import { WINSTON_CONFIG } from 'src/config/logger.config';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(WINSTON_CONFIG),
    TypeOrmModule.forRootAsync(DATABASE_CONFIG),
    HealthModule,
    SchedulerModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
