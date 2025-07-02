import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsProducer } from './queue/producer/sms.producer';
import { smsTemplate } from './sms/template/sms.template';
import { SendSmsDto } from './sms/dto/sendSms.dto';
import { SmsRepository } from './sms/repository/sms.repository';
import { SmsRequestStatusEnum } from '../../common/constant/enum';
import { UserSmsFilterDto } from './sms/dto/query.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly smsRepository: SmsRepository,
    private readonly smsProducer: SmsProducer,
    public readonly configService: ConfigService,
  ) {}

  async sendSms(dto: SendSmsDto): Promise<void> {
    const { fromPhoneNumber, message, toPhoneNumbers, totalCount, smsTag } = dto;
    /* SMS 요청 정보 저장 */
    const smsRequestIdx: number = await this.smsRepository.createSmsRequest(fromPhoneNumber, message, totalCount);
    try {
      /* 개별 발신 정보 저장 및 메시지 발송*/
      await Promise.all(
        toPhoneNumbers.map(async (toPhoneNumber: string) => {
          // 개별 발신 정보 저장
          const smsMessageIdx: number = await this.smsRepository.createSmsMessage(smsRequestIdx, toPhoneNumber, smsTag);
          // 메시지 발송
          const cleanedMessage = smsTemplate(message);
          await this.smsProducer.enqueueSmsJob(fromPhoneNumber, toPhoneNumber, cleanedMessage, smsMessageIdx);
        }),
      );

      /* SMS 요청 "완료"로 업데이트 */
      await this.smsRepository.updateSmsRequest(smsRequestIdx, SmsRequestStatusEnum.COMPLETED);

      return;
    } catch (err) {
      /* SMS 요청 "중단"으로 업데이트 */
      await this.smsRepository.updateSmsRequest(smsRequestIdx, SmsRequestStatusEnum.PENDING);
    }
  }

  async getSmsSendHistory(filterInfo?: UserSmsFilterDto) {
    const result = await this.smsRepository.getSmsSendHistory(filterInfo);

    return result;
  }
}
