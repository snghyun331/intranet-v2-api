import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/entity/common.entity';
import { AdminGradeEntity } from './grade.entity';
import { UserEntity } from '../user/user.entity';

@Entity({ name: 'admin', comment: '어드민 tb' })
export class AdminEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'admin_idx', comment: '어드민 IDX' })
  adminIdx: number;

  @Column({ name: 'user_idx', comment: '유저 IDX', nullable: false })
  userIdx: number;

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

  @ManyToOne(() => UserEntity, (user) => user.adminRelation, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_idx', referencedColumnName: 'userIdx' })
  userIdxRelation: UserEntity;
}
