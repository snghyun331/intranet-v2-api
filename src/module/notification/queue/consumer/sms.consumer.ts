import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { SmsService } from '../../sms/sms.service';

@Processor('sms')
export class SmsConsumer {
  private logger = new Logger(SmsConsumer.name);
  constructor(private readonly smsService: SmsService) {}

  @Process({ name: 'send-sms', concurrency: 5 })
  async handleSendSms(job: Job) {
    const { fromPhoneNumber, toPhoneNumber, message, smsMessageIdx } = job.data;

    try {
      await this.smsService.noticeSms(fromPhoneNumber, toPhoneNumber, message, smsMessageIdx);
      console.log(`✅ [성공] ${toPhoneNumber} 에게 SMS 전송 성공`);
    } catch (err) {
      this.logger.error(`❌ [실패] ${toPhoneNumber} 에게 SMS 전송 실패`, err);

      throw err;
    }
  }
}
