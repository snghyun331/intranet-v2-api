import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Injectable } from '@nestjs/common';
import { QUEUE_RETRY_CONFIG } from '../../constant/constant';

@Injectable()
export class SmsProducer {
  constructor(@InjectQueue('sms') private readonly smsQueue: Queue) {}

  async enqueueSmsJob(fromPhoneNumber: string, toPhoneNumber: string, message: string, smsMessageIdx: number) {
    await this.smsQueue.add(
      'send-sms',
      { fromPhoneNumber, toPhoneNumber, message, smsMessageIdx },
      {
        attempts: QUEUE_RETRY_CONFIG.ATTEMPTS,
        backoff: QUEUE_RETRY_CONFIG.BACKOFF,
        removeOnComplete: {
          age: QUEUE_RETRY_CONFIG.COMPLETE_AGE,
        },
        removeOnFail: {
          age: QUEUE_RETRY_CONFIG.FAIL_AGE,
        },
      },
    );
  }
}
