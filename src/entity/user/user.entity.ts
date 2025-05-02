import { GenderEnum, YNEnum } from '@common/constant/enum';
import { CommonEntity } from '@common/entity/common.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { HeadquarterEntity } from './headquarter.entity';
import { TeamEntity } from './team.entity';
import { GradeEntity } from './grade.entity';
import { MealEntity } from '@entity/meal/meal.entity';
import { MealStatsEntity } from '@entity/meal/mealStats.entity';
import { WelfareEntity } from '@entity/welfare/welfare.entity';
import { WelfareStatsEntity } from '@entity/welfare/welfareStats.entity';
import { WelfareMonthlyStatsEntity } from '@entity/welfare/welfareMonthlyStats.entity';
import { ActivityMonthlyStatsEntity } from '@entity/activity/activityMonthlyStats.entity';
import { ActivityStatsEntity } from '@entity/activity/activityStats.entity';
import { ActivityEntity } from '@entity/activity/activity.entity';
import { AdminEntity } from '@entity/admin/admin.entity';
import { CommuteEntity } from '@entity/intranet/commute/commute.entity';
import { CommuteApproverEntity } from '@entity/intranet/commute/commuteApprover.entity';
import { LeaveMonthlyUsageEntity } from '@entity/intranet/leave/leaveMonthlyUsage.entity';
import { LeaveUsageEntity } from '@entity/intranet/leave/leaveUsage.entity';
import { LeaveStatsEntity } from '@entity/intranet/leave/leaveStats.entity';
import { CommuteCCUserEntity } from '@entity/intranet/commute/commuteCCUser.entity';
import { LeaveExtraEntity } from '@entity/intranet/leave/leaveExtra.entity';

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

  @Column({ name: 'user_personal_email', comment: '개인 이메일', nullable: true })
  userPersonalEmail: string;

  @Column({ name: 'account_number', comment: '계좌번호', nullable: true })
  accountNumber: string;

  @Column({ name: 'account_bank', comment: '계좌은행', nullable: true })
  accountBank: string;

  @Column({ name: 'passport_name', comment: '여권 성명', nullable: true })
  passportName: string;

  @Column({ name: 'passport_birth', comment: '여권 생년월일', nullable: true })
  passportBirth: string;

  @Column({ name: 'passport_no', comment: '여권 번호', nullable: true })
  passportNo: string;

  @Column({ name: 'passport_expiry', comment: '여권 만료일', nullable: true })
  passportExpiry: string;

  @Column({ name: 'probation_period', comment: '수습기간', nullable: true })
  probationPeriod: string;

  @Column({ name: 'login_token', comment: '로그인 토큰', length: 1000, nullable: true })
  loginToken: string;

  @Column({
    type: 'enum',
    enum: YNEnum,
    name: 'user_avail',
    comment: '재직 퇴사 여부',
    default: YNEnum.YES,
    nullable: false,
  })
  userAvail: YNEnum;

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

  @OneToMany(() => LeaveExtraEntity, (leaveExtra) => leaveExtra.userIdxRelation)
  leaveExtraRelation: LeaveExtraEntity[];
}
