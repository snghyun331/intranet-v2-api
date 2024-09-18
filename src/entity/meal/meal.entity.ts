import { MealTypeEnum } from '../../common/constant/enum';
import { CommonEntity } from '../../common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'meal', comment: '식대 사용내역 tb' })
export class MealEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'meal_idx', comment: '식대 IDX' })
  mealIdx: number;

  @Column({ name: 'user_idx', comment: '사용자 IDX', nullable: false })
  userIdx: number;

  @Column({ name: 'use_date', comment: '식대 사용일', nullable: false })
  useDate: string;

  @Column({ name: 'attendance', comment: '근태', nullable: false })
  attendance: string;

  @Column({ type: 'enum', enum: MealTypeEnum, name: 'meal_type', comment: '조식 중식 석식', nullable: true })
  mealType: MealTypeEnum;

  @Column({ name: 'diner_name', comment: '식당 상호명', nullable: true })
  dinerName: string;

  @Column({ name: 'pay_amount', comment: '결제 금액', nullable: false, default: 0 })
  payAmount: number;

  @Column({ name: 'payer', comment: '결제자 이름', nullable: true })
  payer: string;

  @ManyToOne(() => UserEntity, (user) => user.mealRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
