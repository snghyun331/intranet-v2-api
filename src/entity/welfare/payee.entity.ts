import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { WelfareEntity } from './welfare.entity';
import { UserEntity } from '../user/user.entity';
import { YNEnum } from '../../common/constant/enum';

@Entity({ name: 'welfare_payee', comment: '(복지포인트)대리결제 대상자 tb' })
export class WelfarePayeeEntity {
  @PrimaryColumn({ name: 'welfare_idx', comment: '복포내역IDX' })
  welfareIdx: number;

  @PrimaryColumn({ name: 'user_idx', comment: '사용자IDX' })
  userIdx: number;

  @Column({ name: 'amount', comment: '결제 금액', nullable: true })
  amount: number;

  @Column({ name: 'payeer_written_yn', comment: 'payeer가 작성했는지 여부', default: YNEnum.NO, nullable: false })
  payeerWrittenYN: YNEnum;

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
