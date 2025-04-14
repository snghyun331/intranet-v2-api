import { GenderEnum, YNEnum } from '../../common/constant/enum';
import { CommonEntity } from '../../common/entity/common.entity';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HeadquarterEntity } from './headquarter.entity';
import { TeamEntity } from './team.entity';
import { GradeEntity } from './grade.entity';
import { MealEntity } from '../meal/meal.entity';
import { MealStatsEntity } from '../meal/mealStats.entity';
import { WelfareEntity } from '../welfare/welfare.entity';
import { WelfareStatsEntity } from '../welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '../welfare/welfareMonthlyStats.entity';
import { ActivityMonthlyStatsEntity } from '../activity/activityMonthlyStats.entity';
import { ActivityStatsEntity } from '../activity/activityStats.entity';
import { ActivityEntity } from '../activity/activity.entity';
import { AdminEntity } from '../admin/admin.entity';
import { CommuteEntity } from '../intranet/commute/commute.entity';
import { CommuteApproverEntity } from '../intranet/commute/commuteApprover.entity';
import { LeaveMonthlyUsageEntity } from '../intranet/leave/leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from '../intranet/leave/leaveUsage.entity';
import { LeaveStatsEntity } from '../intranet/leave/leaveStats.entity';
import { CommuteCCUserEntity } from '../intranet/commute/commuteCCUser.entity';

@Entity({ name: 'user', comment: '사용자 tb' })
export class UserEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ name: 'user_idx', comment: '사용자 IDX' })
  userIdx: number;

  @Column({ name: 'id', comment: '아이디', nullable: false })
  id: string;

  @Column({ name: 'password', comment: '패스워드', nullable: false })
  password: string;

  @Column({ name: 'user_name', comment: '이름', nullable: false })
  userName: string;

  @Column({ type: 'enum', enum: GenderEnum, name: 'user_gender', comment: '성별', nullable: false })
  userGender: GenderEnum;

  @Column({ name: 'user_cell', comment: '전화번호', nullable: false })
  userCell: string;

  @Column({ name: 'user_email', comment: '회사 이메일', nullable: false })
  userEmail: string;

  @Column({ name: 'user_birth', comment: '생년월일', nullable: false })
  userBirth: string;

  @Column({ name: 'user_address', comment: '집 주소', nullable: true })
  userAddress: string;

  @Column({ name: 'join_date', comment: '입사일', nullable: false })
  joinDate: string;

  @Column({ name: 'hq_idx', type: 'tinyint', comment: '본부IDX', nullable: true })
  hqIdx: number;

  @Column({ name: 'team_idx', type: 'tinyint', comment: '팀IDX', nullable: true })
  teamIdx: number;

  @Column({ name: 'grade_idx', type: 'tinyint', comment: '직급IDX', nullable: true })
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

  @Column({ name: 'comment', comment: '특이사항', type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'login_token', comment: '로그인 토큰', length: 1000, nullable: true })
  loginToken: string;

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

  @OneToMany(() => WelfareEntity, (welfare) => welfare.userIdxRelation)
  welfareRelation: WelfareEntity[];

  @OneToMany(() => WelfareMonthlyStatsEntity, (welfareMonthStats) => welfareMonthStats.userIdxRelation)
  welfareMonthStatsRelation: WelfareMonthlyStatsEntity[];

  @OneToMany(() => WelfareStatsEntity, (welfareStats) => welfareStats.userIdxRelation)
  welfareStatsRelation: WelfareStatsEntity[];

  @OneToMany(() => ActivityEntity, (activity) => activity.userIdxRelation)
  activityRelation: ActivityEntity[];

  @OneToMany(() => ActivityMonthlyStatsEntity, (activityMonthStats) => activityMonthStats.userIdxRelation)
  activityMonthStatsRelation: ActivityMonthlyStatsEntity[];

  @OneToMany(() => ActivityStatsEntity, (activityStats) => activityStats.userIdxRelation)
  activityStatsRelation: ActivityStatsEntity[];

  @OneToMany(() => AdminEntity, (admin) => admin.userIdxRelation)
  adminRelation: AdminEntity[];

  @OneToMany(() => CommuteEntity, (commute) => commute.userIdxRelation)
  commuteRelation: CommuteEntity[];

  @OneToMany(() => CommuteApproverEntity, (commuteApprover) => commuteApprover.userIdxRelation)
  commuteApproverRelation: CommuteApproverEntity[];

  @OneToMany(() => CommuteCCUserEntity, (commuteCCUser) => commuteCCUser.userIdxRelation)
  commuteCCUserRelation: CommuteCCUserEntity[];

  @OneToMany(() => LeaveMonthlyUsageEntity, (monthlyUseCount) => monthlyUseCount.userIdxRelation)
  monthlyUseCountRelation: LeaveMonthlyUsageEntity[];

  @OneToMany(() => LeaveUsageEntity, (usage) => usage.userIdxRelation)
  usageRelation: LeaveUsageEntity[];

  @OneToMany(() => LeaveStatsEntity, (leaveStats) => leaveStats.userIdxRelation)
  leaveStatsRelation: LeaveStatsEntity[];
}
