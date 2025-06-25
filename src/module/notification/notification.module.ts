import { Global, Module } from '@nestjs/common';
import { QueueModule } from './queue/queue.module';
import { UserNotificationController } from './notification.controller';
import { NotificationService } from './notification.sevice';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsRequestEntity } from '@entity/sms/smsRequest.entity';
import { SmsMessageEntity } from '@entity/sms/smsMessage.entity';
import { SmsModule } from './sms/sms.module';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SmsRequestEntity, SmsMessageEntity]), QueueModule, SmsModule],
  providers: [NotificationService],
  controllers: [UserNotificationController],
})
export class NotificationModule {}
