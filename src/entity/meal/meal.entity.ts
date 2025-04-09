import { MealTypeEnum, YNEnum } from '../../common/constant/enum';
import { CommonEntity } from '../../common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'meal', comment: '식대 사용내역 tb' })
export class MealEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'meal_idx', comment: '식대 IDX' })
  mealIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'target_day', comment: '식대 사용일', nullable: false })
  targetDay: string;

  @Column({
    name: 'holiday_yn',
    type: 'enum',
    enum: YNEnum,
    comment: '업무일 구분',
    default: YNEnum.NO,
    nullable: false,
  })
  holidayYN: YNEnum;

  @Column({ name: 'attendance', comment: '근태', nullable: true })
  attendance: string;

  @Column({ name: 'meal_type', comment: '조식 중식 석식', type: 'enum', enum: MealTypeEnum, nullable: true })
  mealType: MealTypeEnum;

  @Column({ name: 'place', comment: '식당 상호명', nullable: true })
  place: string;

  @Column({ name: 'amount', comment: '결제 금액', nullable: true, default: 0 })
  amount: number;

  @Column({ name: 'payer_name', comment: '결제자 이름', nullable: true })
  payerName: string;

  @ManyToOne(() => UserEntity, (user) => user.mealRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
