import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SmsConsumer } from './consumer/sms.consumer';
import { SmsService } from '../sms/sms.service';
import { SmsRepository } from '../sms/repository/sms.repository';
import { SmsMessageEntity } from '@entity/sms/smsMessage.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsRequestEntity } from '../../../entity/sms/smsRequest.entity';
import { SmsProducer } from './producer/sms.producer';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SmsRequestEntity, SmsMessageEntity]),
    BullModule.registerQueue({
      name: 'sms',
      limiter: {
        max: 20, // 초당 최대 10개 Job 실행
        duration: 3000, // 1초 기준
      },
    }),
  ],
  providers: [SmsProducer, SmsConsumer, SmsService, SmsRepository],
  exports: [BullModule, SmsProducer],
})
export class QueueModule {}
