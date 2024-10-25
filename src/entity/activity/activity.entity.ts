import { CommonEntity } from '../../common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { ConfirmEnum } from '../../common/constant/enum';

@Entity({ name: 'activity', comment: '활동비 사용내역 tb' })
export class ActivityEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'activity_idx', comment: '활동비내역IDX' })
  activityIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'target_day', comment: '활동비 사용일', nullable: false })
  targetDay: string;

  @Column({ name: 'content', comment: '사용처', nullable: false })
  content: string;

  @Column({ name: 'amount', comment: '결제 금액', nullable: true })
  amount: number;

  @Column({ name: 'payer_name', comment: '결제자(법인카드 주인) 이름', nullable: false })
  payerName: string;

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
  confirmDate: string;

  @ManyToOne(() => UserEntity, (user) => user.activityRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
