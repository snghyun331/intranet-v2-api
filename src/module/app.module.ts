import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { LoggerMiddleware } from '../common/middleware/logger.middleware';
import { MONGOOSE_CONFIG, TYPEORM_CONFIG } from '../config/database.config';
import { WINSTON_CONFIG } from '../config/logger.config';
import { HealthModule } from './health/health.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { MealModule } from './meal/meal.module';
import { AuthModule } from './auth/auth.module';
import { WelfareModule } from './welfare/welfare.module';
import { UserModule } from './user/user.module';
import { ActivityModule } from './activity/activity.module';
import { AdminModule } from './admin/admin.module';
import { PlaygroundModule } from './playground/playground.module';
import { FileModule } from './file/file.module';
import { NoticeModule } from './notice/notice.module';
import { AwsModule } from './aws/aws.module';
import { IntranetModule } from './intranet/intranet.module';
import { MongooseModule } from '@nestjs/mongoose';
import { REDIS_CONFIG } from '../config/redis.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { GlobalModule } from './global/global.module';
import { NotificationModule } from './notification/notification.module';
import { BullModule } from '@nestjs/bull';
import { BULL_CONFIG } from '../config/bull.config';
import { MeetingModule } from './meeting/meeting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRoot(WINSTON_CONFIG),
    TypeOrmModule.forRootAsync(TYPEORM_CONFIG),
    MongooseModule.forRootAsync(MONGOOSE_CONFIG),
    RedisModule.forRootAsync(REDIS_CONFIG),
    BullModule.forRootAsync(BULL_CONFIG),
    SchedulerModule,
    AuthModule,
    MealModule,
    WelfareModule,
    ActivityModule,
    IntranetModule,
    NoticeModule,
    MeetingModule,
    NotificationModule,
    PlaygroundModule,
    FileModule,
    UserModule,
    AdminModule,
    AwsModule,
    GlobalModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
