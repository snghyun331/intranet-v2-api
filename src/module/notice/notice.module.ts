import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeEntity } from '../../entity/notice/notice.entity';
import { NoticeService } from './notice.service';
import { NoticeRepostiory } from './repository/notice.repository';
import { NoticeController } from './notice.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity])],
  providers: [NoticeService, NoticeRepostiory],
  controllers: [NoticeController],
})
export class NoticeModule {}
