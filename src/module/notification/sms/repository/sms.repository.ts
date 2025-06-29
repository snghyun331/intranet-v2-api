import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import { SmsMessageEntity } from '@entity/sms/smsMessage.entity';
import { SmsRequestEntity } from '@entity/sms/smsRequest.entity';
import { SmsMessageStatusEnum, SmsRequestStatusEnum } from '@common/constant/enum';
import { UserSmsFilterDto } from '../dto/query.dto';

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
      .set({ status: SmsMessageStatusEnum.FAILED, failureReason: errMessage })
      .where('smsMessageIdx = :smsMessageIdx', { smsMessageIdx })
      .execute();
  }

  async handleSmsSuccess(smsMessageIdx: number): Promise<UpdateResult> {
    return await this.smsMessageModel
      .createQueryBuilder()
      .update(SmsMessageEntity)
      .set({ status: SmsMessageStatusEnum.SUCCESSED, sendAt: new Date() })
      .where('smsMessageIdx = :smsMessageIdx', { smsMessageIdx })
      .execute();
  }

  async updateSmsRequest(smsRequestIdx: number, status: SmsRequestStatusEnum): Promise<UpdateResult> {
    return await this.smsRequestModel
      .createQueryBuilder()
      .update(SmsRequestEntity)
      .set({ status })
      .where('smsRequestIdx = :smsRequestIdx', { smsRequestIdx })
      .execute();
  }

  async getSmsSendHistory(filterInfo?: UserSmsFilterDto) {
    const query: SelectQueryBuilder<SmsMessageEntity> = this.smsMessageModel
      .createQueryBuilder('smsMessageEntity')
      .select([
        'smsMessageEntity.smsMessageIdx AS smsMessageIdx',
        'smsMessageEntity.toPhoneNumber AS toPhoneNumber',
        'smsMessageEntity.status AS status',
        'smsMessageEntity.sendAt AS sendAt',
        'smsMessageEntity.failureReason AS failureReason',
        'smsRequestEntity.fromPhoneNumber AS fromPhoneNumber',
        'smsRequestEntity.message AS message',
        'smsRequestEntity.fromPhoneNumber AS fromPhoneNumber',
        'smsMessageEntity.createdAt AS createdAt',
      ])
      .innerJoin(
        SmsRequestEntity,
        'smsRequestEntity',
        'smsRequestEntity.smsRequestIdx = smsMessageEntity.smsRequestIdx',
      );

    if (filterInfo && filterInfo.sDate && filterInfo.eDate) {
      const startDate = moment(`${filterInfo.sDate} 00:00:00`).utcOffset(9).utc().toDate();
      const endDate = moment(`${filterInfo.eDate} 23:59:59`).utcOffset(9).utc().toDate();
      query.andWhere('smsMessageEntity.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate });
    }
    if (filterInfo && filterInfo.status) {
      query.andWhere('smsMessageEntity.status = :status', { status: filterInfo.status });
    }
    if (filterInfo && filterInfo.toPhoneNumber) {
      query.andWhere('smsMessageEntity.toPhoneNumber = :toPhoneNumber', { toPhoneNumber: filterInfo.toPhoneNumber });
    }

    query.orderBy('smsMessageEntity.createdAt', 'DESC').addOrderBy('smsMessageEntity.sendAt', 'DESC');

    const result = await query.getRawMany();

    return result;
  }
}
