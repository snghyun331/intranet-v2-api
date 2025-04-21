import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { UserEntity } from '../user/user.entity';
import { ClearStatusEnum, HalfYearEnum } from '../../common/constant/enum';

@Entity({ name: 'activity_stats', comment: '활동비 통계 tb' })
export class ActivityStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'activity_stats_idx', comment: '활동비 통계 IDX' })
  activityStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'half_year', type: 'enum', enum: HalfYearEnum, comment: '상하반기 구분', nullable: false })
  halfYear: HalfYearEnum;

  @Column({ name: 'activity_budget', comment: '활동비 사용가능 금액', nullable: false })
  activityBudget: number;

  @Column({ name: 'activity_expense', comment: '활동비 사용금액', default: 0, nullable: false })
  activityExpense: number;

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

  @ManyToOne(() => UserEntity, (user) => user.activityStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
