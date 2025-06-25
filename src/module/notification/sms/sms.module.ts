import { Global, Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsRepository } from './repository/sms.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsMessageEntity } from '@entity/sms/smsMessage.entity';
import { SmsRequestEntity } from '@/entity/sms/smsRequest.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SmsRequestEntity, SmsMessageEntity])],
  providers: [SmsService, SmsRepository],
  exports: [SmsService, SmsRepository],
})
export class SmsModule {}
