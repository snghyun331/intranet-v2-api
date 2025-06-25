import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { SmsMessageEntity } from './smsMessage.entity';
import { SmsStatusEnum } from '../../common/constant/enum';

@Entity({ name: 'sms_request', comment: 'SMS 발송 정보 tb' })
export class SmsRequestEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'sms_request_idx', comment: 'SMS 발송 정보 IDX' })
  smsRequestIdx: number;

  @Column({ name: 'from_phone_number', comment: '발신 전화번호', type: String, length: 15, nullable: false })
  fromPhoneNumber: string;

  @Column({ name: 'message', type: 'text', comment: '발송할 메시지 내용' })
  message: string;

  @Column({ name: 'total_count', type: Number, default: 0, comment: '총 발송 대상 수', nullable: false })
  totalCount: number;

  @Column({
    name: 'status',
    comment: '발송 상태',
    type: String,
    default: SmsStatusEnum.PROCESSING,
    nullable: false,
  })
  status: string;

  @OneToMany(() => SmsMessageEntity, (smsMessage) => smsMessage.smsRequestRelation)
  smsMessageRelation: SmsMessageEntity[];
}
