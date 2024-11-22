import { Column, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';
import { AdminEntity } from '../admin/admin.entity';

@Entity({ name: 'headquarter', comment: '본부 tb' })
export class HeadquarterEntity {
  @PrimaryGeneratedColumn({ name: 'hq_idx', comment: '본부 IDX' })
  hqIdx: number;

  @Column({ name: 'hq_name', comment: '본부명', nullable: false })
  hqName: string;

  @DeleteDateColumn({ type: 'datetime', name: 'hq_avail', comment: '유효성 여부' })
  hqAvail: Date | null;

  @OneToMany(() => UserEntity, (user) => user.hqIdxRelation)
  userRelation: UserEntity[];

  @OneToMany(() => AdminEntity, (admin) => admin.hqIdxRelation)
  adminRelation: AdminEntity[];
}
