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
import { AdminModule } from './admin/admin.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { REDIS_CONFIG } from '../config/redis.config';
import { PlaygroundModule } from './playground/playground.module';
import { FileModule } from './file/file.module';
import { NoticeModule } from './notice/notice.module';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(WINSTON_CONFIG),
    TypeOrmModule.forRootAsync(DATABASE_CONFIG),
    RedisModule.forRootAsync(REDIS_CONFIG),
    SchedulerModule,
    AuthModule,
    MealModule,
    WelfareModule,
    ActivityModule,
    QnaModule,
    NoticeModule,
    PlaygroundModule,
    FileModule,
    UserModule,
    AdminModule,
    AwsModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
