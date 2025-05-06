import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRespository } from './repository/admin.repository';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGradeEntity } from '@entity/admin/grade.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdminGradeEntity])],
  providers: [AdminRespository, AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
