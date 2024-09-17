import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'holiday', comment: '공휴일 정보 tb' })
export class HolidayEntity {
  @PrimaryGeneratedColumn({ name: 'holiday_idx', comment: '공휴일 IDX' })
  holidayIdx: number;

  @Column({ name: 'holiday_date', comment: '공휴일 날짜', nullable: false })
  holidayDate: string;

  @Column({ name: 'holiday_name', comment: '공휴일 이름', nullable: false })
  holidayName: string;
}
