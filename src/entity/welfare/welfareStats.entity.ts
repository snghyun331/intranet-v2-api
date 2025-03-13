import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { UserEntity } from '../user/user.entity';
import { ClearStatusEnum, HalfYearEnum } from '../../common/constant/enum';

@Entity({ name: 'welfare_stats', comment: '복포 통계 tb' })
export class WelfareStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'welfare_stats_idx', comment: '복포 통계 IDX' })
  welfareStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'half_year', type: 'enum', enum: HalfYearEnum, comment: '상하반기 구분', nullable: false })
  halfYear: HalfYearEnum;

  @Column({ name: 'welfare_budget', comment: '복지포인트 사용가능 금액', nullable: false })
  welfareBudget: number;

  @Column({ name: 'welfare_expense', comment: '복지포인트 사용금액', default: 0, nullable: false })
  welfareExpense: number;

  @Column({ name: 'total_overpay', comment: '정산금', default: 0, nullable: false })
  totalOverpay: number;

  @Column({ name: 'note', comment: '비고', type: 'text', nullable: true })
  note: string;

  @Column({
    name: 'clear_status',
    comment: '정산여부',
    type: String,
    default: ClearStatusEnum.NOT_YET,
    nullable: false,
  })
  clearStatus: string;

  @ManyToOne(() => UserEntity, (user) => user.welfareStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
