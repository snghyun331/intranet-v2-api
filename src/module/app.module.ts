import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { LoggerMiddleware } from '../common/middleware/logger.middleware';
import { DATABASE_CONFIG } from '../config/database.config';
import { WINSTON_CONFIG } from '../config/logger.config';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MealModule } from './meal/meal.module';
import { AuthModule } from './auth/auth.module';
import { WelfareModule } from './welfare/welfare.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { QnaModule } from './qna/qna.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(WINSTON_CONFIG),
    TypeOrmModule.forRootAsync(DATABASE_CONFIG),
    SchedulerModule,
    AuthModule,
    MealModule,
    WelfareModule,
    ActivityModule,
    QnaModule,
    UserModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
