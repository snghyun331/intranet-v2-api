import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class CommonEntity {
  @CreateDateColumn({ name: 'created_at', precision: null })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: null })
  updatedAt: Date;
}
