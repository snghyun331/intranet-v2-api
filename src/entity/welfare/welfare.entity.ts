import { CommonEntity } from '@common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { ConfirmEnum, YNEnum } from '@common/constant/enum';

@Entity({ name: 'welfare', comment: '복지포인트 사용내역 tb' })
export class WelfareEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'welfare_idx', comment: '복포내역IDX' })
  welfareIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'target_day', comment: '복포 사용일', nullable: false })
  targetDay: string;

  @Column({ name: 'content', comment: '사용처', nullable: false })
  content: string;

  @Column({ name: 'amount', comment: '결제 금액', nullable: true })
  amount: number;

  @Column({ name: 'payer_name', comment: '결제자 이름', nullable: false })
  payerName: string;

  @Column({ name: 'self_written_yn', comment: '본인 등록 여부', default: YNEnum.YES, nullable: false })
  selfWrittenYN: YNEnum;

  @Column({ name: 'payer_welfare_idx', comment: '결제자 복포IDX', nullable: true })
  payerWelfareIdx: number;

  @Column({
    name: 'confirm_yn',
    comment: 'P&C 확인여부',
    type: 'enum',
    enum: ConfirmEnum,
    default: ConfirmEnum.NO,
    nullable: false,
  })
  confirmYN: ConfirmEnum;

  @Column({ name: 'confirm_date', comment: 'P&C 확인 날짜', nullable: true })
  confirmDate: Date;

  @ManyToOne(() => UserEntity, (user) => user.welfareRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @ManyToOne(() => WelfareEntity, (welfare) => welfare.payeeWelfareRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'payer_welfare_idx', referencedColumnName: 'welfareIdx' })
  payeeWelfareRelation: WelfareEntity;
}
