import { Column, Entity } from 'typeorm';

@Entity({ name: 'meal_base', comment: '월별 기본 식대 tb' })
export class MealBaseEntity {
  @Column({ primary: true, name: 'year', comment: '연도', type: String, nullable: false })
  year: string;

  @Column({ primary: true, name: 'month', comment: '월', type: String, nullable: false })
  month: string;

  @Column({ name: 'base_amount', comment: '기본 식대금액', type: Number, nullable: false })
  baseAmount: number;
}
