import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { AdminEntity } from './admin.entity';

@Entity({ name: 'admin_grade', comment: '어드민 직급 tb' })
export class AdminGradeEntity {
  @PrimaryGeneratedColumn({ name: 'admin_grade_idx', comment: '직급 IDX' })
  adminGradeIdx: number;

  @Column({ name: 'admin_grade_name', comment: '직급명', nullable: false })
  adminGradeName: string;

  @OneToMany(() => AdminEntity, (admin) => admin.adminGradeIdxRelation)
  adminRelation: AdminEntity[];
}
