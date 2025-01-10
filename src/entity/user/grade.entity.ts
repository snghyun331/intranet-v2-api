import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'grade', comment: '직급 tb' })
export class GradeEntity {
  @PrimaryGeneratedColumn({ name: 'grade_idx', comment: '직급 IDX' })
  gradeIdx: number;

  @Column({ name: 'grade_name', comment: '직급명', nullable: false })
  gradeName: string;

  @OneToMany(() => UserEntity, (user) => user.gradeIdxRelation)
  userRelation: UserEntity[];
}
