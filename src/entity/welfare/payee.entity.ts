import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WelfareEntity } from './welfare.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'welfare_payee', comment: '(복지포인트)대리결제 대상자 tb' })
export class WelfarePayeeEntity {
  @PrimaryColumn({ name: 'user_idx', comment: '사용자IDX' })
  userIdx: number;

  @PrimaryColumn({ name: 'welfare_idx', comment: '복포내역IDX' })
  welfareIdx: number;

  @Column({ name: 'amount', comment: '결제 금액', nullable: false })
  amount: number;

  @ManyToOne(() => WelfareEntity, (welfare) => welfare.payeesRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'welfare_idx', referencedColumnName: 'welfareIdx' })
  welfareIdxRelation: WelfareEntity;

  @ManyToOne(() => UserEntity, (user) => user.payeeRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
