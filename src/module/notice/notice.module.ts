import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeEntity } from '../../entity/notice/notice.entity';
import { NoticeService } from './notice.service';
import { NoticeRepostiory } from './repository/notice.repository';
import { NoticeController } from './notice.controller';
import { AwsModule } from '../aws/aws.module';
import { AwsService } from '../aws/aws.service';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity]), AwsModule],
  providers: [NoticeService, NoticeRepostiory, AwsService],
  controllers: [NoticeController],
})
export class NoticeModule {}
