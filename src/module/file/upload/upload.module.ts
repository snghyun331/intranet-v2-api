import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadRepository } from './repository/upload.repository';
import { UploadController } from './upload.controller';
import { AwsModule } from '../../aws/aws.module';
import { AwsService } from '../../aws/aws.service';

@Module({
  imports: [AwsModule],
  providers: [UploadService, UploadRepository, AwsService],
  controllers: [UploadController],
})
export class UploadModule {}
