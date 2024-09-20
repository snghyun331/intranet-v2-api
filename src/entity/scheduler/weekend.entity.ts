import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'weekend', comment: '주말 정보 tb' })
export class WeekendEntity {
  @PrimaryGeneratedColumn({ name: 'weekend_idx', comment: '주말 IDX' })
  weekendIdx: number;

  @Column({ name: 'weekend_date', comment: '주말 날짜', nullable: false })
  weekendDate: string;
}
