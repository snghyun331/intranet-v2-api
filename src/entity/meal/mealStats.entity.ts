import { CommonEntity } from '@common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '@entity/user/user.entity';
import { ClearStatusEnum } from '@common/constant/enum';

@Entity({ name: 'meal_stats', comment: '식대 통계 tb' })
export class MealStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'meal_stats_idx', comment: '식대 통계 IDX' })
  mealStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: string;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: string;

  @Column({ name: 'workdays', comment: '업무일수', nullable: false })
  workdays: number;

  @Column({ name: 'holidays', comment: '휴일수(주말,공휴일)', nullable: false })
  holidays: number;

  @Column({ name: 'time_off_days', comment: '(반)연차/휴무일수', default: 0, nullable: false })
  timeoffDays: number;

  @Column({ name: 'holiday_workdays', comment: '휴일근무일수', default: 0, nullable: false })
  holidayWorkdays: number;

  @Column({ name: 'meal_budget', comment: '이번달 식대(중식) 사용가능 금액', default: 0, nullable: false })
  mealBudget: number;

  @Column({ name: 'meal_expense', comment: '이번달 식대(중식) 사용 금액', default: 0, nullable: false })
  mealExpense: number;

  @Column({ name: 'breakfast_expense', comment: '이번달 식대(조식) 사용 금액', default: 0, nullable: false })
  breakfastExpense: number;

  @Column({ name: 'dinner_expense', comment: '이번달 식대(석식) 사용 금액', default: 0, nullable: false })
  dinnerExpense: number;

  @Column({ name: 'breakfast_overpay', comment: '이번달 조식 초과금액', default: 0, nullable: false })
  breakfastOverpay: number;

  @Column({ name: 'dinner_overpay', comment: '이번달 석식 초과금액', default: 0, nullable: false })
  dinnerOverpay: number;

  @Column({ name: 'total_overpay', comment: '이번달 조중석식 총 정산금', default: 0, nullable: false })
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

  @ManyToOne(() => UserEntity, (user) => user.mealStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
