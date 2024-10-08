import { CommonEntity } from '../../common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { YNEnum } from '../../common/constant/enum';
import { WelfarePayeeEntity } from './payee.entity';

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

  @Column({ name: 'amount', comment: '결제 금액', nullable: false })
  amount: number;

  @Column({ name: 'payer_name', comment: '결제자 이름', nullable: true })
  payerName: string;

  @Column({ name: 'confirm_yn', comment: 'P&C 확인여부', default: YNEnum.NO, nullable: false })
  confirmYN: YNEnum;

  @Column({ name: 'confirm_date', comment: 'P&C 확인 날짜', nullable: true })
  confirmDate: string;

  @ManyToOne(() => UserEntity, (user) => user.welfareRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;

  @OneToMany(() => WelfarePayeeEntity, (payee) => payee.welfareIdxRelation)
  payeesRelation: WelfarePayeeEntity[];
}
