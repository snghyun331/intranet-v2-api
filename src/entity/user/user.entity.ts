import { GenderEnum, YNEnum } from '../../common/constant/enum';
import { CommonEntity } from '../../common/entity/common.entity';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HeadquarterEntity } from './headquarter.entity';
import { TeamEntity } from './team.entity';
import { GradeEntity } from './grade.entity';
import { MealEntity } from '../meal/meal.entity';
import { MealStatsEntity } from '../meal/mealStats.entity';

@Entity({ name: 'user', comment: '사용자 tb' })
export class UserEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'user_idx', comment: '사용자 IDX' })
  userIdx: number;

  @Column({ name: 'id', comment: '아이디', nullable: false })
  id: string;

  @Column({ name: 'password', comment: '패스워드', nullable: false })
  password: string;

  @Column({ name: 'name', comment: '이름', nullable: false })
  name: string;

  @Column({ type: 'enum', enum: GenderEnum, name: 'gender', comment: '성별', nullable: false })
  gender: GenderEnum;

  @Column({ name: 'cell', comment: '전화번호', nullable: false })
  cell: string;

  @Column({ name: 'birth', comment: '생년월일', nullable: false })
  birth: string;

  @Column({ name: 'join_date', comment: '입사일', nullable: false })
  joinDate: string;

  @Column({ name: 'hq_idx', nullable: true })
  hqIdx: number;

  @Column({ name: 'team_idx', nullable: true })
  teamIdx: number;

  @Column({ name: 'grade_idx', nullable: true })
  gradeIdx: number;

  @Column({
    type: 'enum',
    enum: YNEnum,
    default: YNEnum.NO,
    name: 'admin_role',
    comment: '어드민 권한 여부',
    nullable: false,
  })
  adminRole: YNEnum;

  @DeleteDateColumn({ type: 'datetime', name: 'user_avail', comment: '유효성 여부', nullable: true })
  userAvail: Date | null;

  @ManyToOne(() => HeadquarterEntity, (hq) => hq.userRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'hq_idx', referencedColumnName: 'hqIdx' })
  hqIdxRelation: HeadquarterEntity;

  @ManyToOne(() => TeamEntity, (team) => team.userRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'team_idx', referencedColumnName: 'teamIdx' })
  teamIdxRelation: TeamEntity;

  @ManyToOne(() => GradeEntity, (grade) => grade.userRelation, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'grade_idx', referencedColumnName: 'gradeIdx' })
  gradeIdxRelation: GradeEntity;

  @OneToMany(() => MealEntity, (meal) => meal.userIdxRelation)
  mealRelation: MealEntity[];

  @OneToMany(() => MealStatsEntity, (mealStats) => mealStats.userIdxRelation)
  mealStatsRelation: MealStatsEntity[];
}
