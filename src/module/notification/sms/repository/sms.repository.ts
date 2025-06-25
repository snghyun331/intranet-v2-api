import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { SmsMessageEntity } from '@entity/sms/smsMessage.entity';
import { SmsRequestEntity } from '../../../../entity/sms/smsRequest.entity';
import { SmsStatusEnum } from '../../../../common/constant/enum';

@Injectable()
export class SmsRepository {
  constructor(
    @InjectRepository(SmsRequestEntity) private readonly smsRequestModel: Repository<SmsRequestEntity>,
    @InjectRepository(SmsMessageEntity) private readonly smsMessageModel: Repository<SmsMessageEntity>,
  ) {}

  async createSmsRequest(fromPhoneNumber: string, message: string, totalCount: number): Promise<number> {
    const result = await this.smsRequestModel
      .createQueryBuilder()
      .insert()
      .into(SmsRequestEntity)
      .values({ fromPhoneNumber, message, totalCount })
      .execute();

    const smsRequestIdx: number = result.identifiers[0].smsRequestIdx;

    return smsRequestIdx;
  }

  async createSmsMessage(smsRequestIdx: number, toPhoneNumber: string): Promise<number> {
    const result = await this.smsMessageModel
      .createQueryBuilder()
      .insert()
      .into(SmsMessageEntity)
      .values({ smsRequestIdx, toPhoneNumber })
      .execute();

    const smsMessageIdx: number = result.identifiers[0].smsMessageIdx;

    return smsMessageIdx;
  }

  async handleSmsFailure(smsMessageIdx: number, errMessage: string): Promise<UpdateResult> {
    return await this.smsMessageModel
      .createQueryBuilder()
      .update(SmsMessageEntity)
      .set({ status: SmsStatusEnum.FAILED, failureReason: errMessage })
      .where('smsMessageIdx = :smsMessageIdx', { smsMessageIdx })
      .execute();
  }

  async handleSmsSuccess(smsMessageIdx: number): Promise<UpdateResult> {
    return await this.smsMessageModel
      .createQueryBuilder()
      .update(SmsMessageEntity)
      .set({ status: SmsStatusEnum.SUCCESSED, sendAt: new Date() })
      .where('smsMessageIdx = :smsMessageIdx', { smsMessageIdx })
      .execute();
  }

  async updateSmsRequest(smsRequestIdx: number, status: SmsStatusEnum): Promise<UpdateResult> {
    return await this.smsRequestModel
      .createQueryBuilder()
      .update(SmsRequestEntity)
      .set({ status })
      .where('smsRequestIdx = :smsRequestIdx', { smsRequestIdx })
      .execute();
  }
}
