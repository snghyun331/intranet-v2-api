import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoticeEntity } from '@entity/notice/notice.entity';
import { NoticeService } from './notice.service';
import { NoticeRepostiory } from './repository/notice.repository';
import { AdminNoticeController, UserNoticeController } from './notice.controller';
import { AwsModule } from '../aws/aws.module';
import { AwsService } from '../aws/aws.service';
import { NoticeHasImageEntity } from '@entity/image/noticeHasImage.entity';
import { ImageEntity } from '@entity/image/image.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NoticeEntity, NoticeHasImageEntity, ImageEntity]), AwsModule],
  providers: [NoticeService, NoticeRepostiory, AwsService],
  controllers: [UserNoticeController, AdminNoticeController],
})
export class NoticeModule {}
