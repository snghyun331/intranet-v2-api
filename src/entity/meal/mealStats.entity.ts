import { CommonEntity } from 'src/common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { HalfYearEnum } from 'src/common/constant/enum';

@Entity({ name: 'meal_stats', comment: '식대 통계 tb' })
export class MealStatsEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'meal_stats_idx', comment: '식대 통계 IDX' })
  mealStatsIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'year', comment: '연도', nullable: false })
  year: number;

  @Column({ name: 'month', comment: '월', nullable: false })
  month: number;

  @Column({ type: 'enum', enum: HalfYearEnum, name: 'half_year', comment: '상하반기 구분', nullable: false })
  halfYear: HalfYearEnum;

  @Column({ name: 'workdays', comment: '업무일수', default: 0, nullable: false })
  workdays: number;

  @Column({ name: 'holidays', comment: '휴일수(주말,공휴일)', default: 0, nullable: false })
  holidays: number;

  @Column({ name: 'time_off_days', comment: '(반)연차/휴무일수', default: 0, nullable: false })
  timeoffDays: number;

  @Column({ name: 'holiday_workdays', comment: '휴일근무일수', default: 0, nullable: false })
  holidayWorkdays: number;

  @Column({ name: 'meal_budget', comment: '이번달 식대 사용가능 금액', default: 0, nullable: false })
  mealBudget: number;

  @Column({ name: 'meal_balance', comment: '이번달 식대 잔액', default: 0, nullable: false })
  mealBalance: number;

  @Column({ name: 'meal_expense', comment: '이번달 식대 사용 금액', default: 0, nullable: false })
  mealExpense: number;

  @ManyToOne(() => UserEntity, (user) => user.mealStatsRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
