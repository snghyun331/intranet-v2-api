import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '@common/entity/common.entity';
import { SmsRequestEntity } from './smsRequest.entity';
import { SmsMessageStatusEnum } from '@common/constant/enum';

@Entity({ name: 'sms_message', comment: 'SMS 개별 메시지 상세 관리 tb' })
export class SmsMessageEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'sms_message_idx', comment: '개별 메시지 상세 IDX' })
  smsMessageIdx: number;

  @Column({ name: 'sms_request_idx', comment: 'SMS 발송 정보 IDX', type: Number, nullable: false })
  smsRequestIdx: number;

  @Column({ name: 'to_phone_number', length: 15, comment: '수신 전화번호', type: String, nullable: false })
  toPhoneNumber: string;

  @Column({
    name: 'status',
    comment: '메시지 상태',
    type: String,
    default: SmsMessageStatusEnum.PROCESSING,
    nullable: false,
  })
  status: string;

  @Column({ name: 'send_at', comment: '발송 시각', type: 'timestamp', nullable: true })
  sendAt: Date | null;

  @Column({ name: 'failure_reason', comment: '발송 실패 에러 메시지', type: 'text', nullable: true })
  failureReason: string | null;

  @ManyToOne(() => SmsRequestEntity, (smsRequest) => smsRequest.smsMessageRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sms_request_idx', referencedColumnName: 'smsRequestIdx' })
  smsRequestRelation: SmsRequestEntity;
}
