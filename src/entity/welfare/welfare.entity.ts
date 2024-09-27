import { CommonEntity } from '../../common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'welfare', comment: '복지포인트 사용내역 tb' })
export class WelfareEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'welfare_idx', comment: '복포 IDX' })
  welfareIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'use_date', comment: '복포 사용일', nullable: false })
  useDate: string;

  @Column({ name: 'content', comment: '사용처', nullable: false })
  content: string;

  @Column({ name: 'pay_amount', comment: '결제 금액', nullable: false })
  payAmount: number;

  @Column({ name: 'payer', comment: '대리결제 대상자', nullable: true })
  payer: string;

  @ManyToOne(() => UserEntity, (user) => user.welfareRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
