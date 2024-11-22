import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { AdminGradeEntity } from './grade.entity';
import { HeadquarterEntity } from '../user/headquarter.entity';
import { TeamEntity } from '../user/team.entity';
import { GradeEntity } from '../user/grade.entity';

@Entity({ name: 'admin', comment: '어드민 tb' })
export class AdminEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'admin_idx', comment: '어드민 IDX' })
  adminIdx: number;

  @Column({ name: 'id', comment: '아이디', nullable: false })
  id: string;

  @Column({ name: 'password', comment: '패스워드', nullable: false })
  password: string;

  @Column({ name: 'admin_name', comment: '어드민 이름', nullable: false })
  adminName: string;

  @Column({ name: 'admin_email', comment: '회사 이메일', nullable: false })
  adminEmail: string;

  @Column({ name: 'admin_grade_idx', type: 'tinyint', comment: '어드민 등급IDX', nullable: false })
  adminGradeIdx: number;

  @Column({ name: 'hq_idx', type: 'tinyint', comment: '본부IDX', nullable: true })
  hqIdx: number;

  @Column({ name: 'team_idx', type: 'tinyint', comment: '팀IDX', nullable: true })
  teamIdx: number;

  @Column({ name: 'grade_idx', type: 'tinyint', comment: '직급IDX', nullable: true })
  gradeIdx: number;

  @Column({ name: 'login_token', comment: '로그인 토큰', length: 1000, nullable: true })
  loginToken: string;

  @DeleteDateColumn({ type: 'datetime', name: 'admin_avail', comment: '유효성 여부', nullable: true })
  adminAvail: Date | null;

  @ManyToOne(() => AdminGradeEntity, (adminGrade) => adminGrade.adminRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'admin_grade_idx', referencedColumnName: 'adminGradeIdx' })
  adminGradeIdxRelation: AdminGradeEntity;

  @ManyToOne(() => HeadquarterEntity, (hq) => hq.adminRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'hq_idx', referencedColumnName: 'hqIdx' })
  hqIdxRelation: HeadquarterEntity;

  @ManyToOne(() => TeamEntity, (team) => team.adminRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'team_idx', referencedColumnName: 'teamIdx' })
  teamIdxRelation: TeamEntity;

  @ManyToOne(() => GradeEntity, (grade) => grade.adminRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'grade_idx', referencedColumnName: 'gradeIdx' })
  gradeIdxRelation: GradeEntity;
}
