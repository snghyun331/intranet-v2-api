import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity({ name: 'team', comment: '팀명 tb' })
export class TeamEntity {
  @PrimaryGeneratedColumn({ name: 'team_idx', comment: '팀 IDX' })
  teamIdx: number;

  @Column({ name: 'team_name', comment: '팀명', nullable: false })
  teamName: string;

  @DeleteDateColumn({ type: 'datetime', name: 'team_avail', comment: '유효성 여부' })
  teamAvail: Date | null;

  @OneToMany(() => UserEntity, (user) => user.teamIdxRelation)
  userRelation: UserEntity[];
}
