import { Module } from '@nestjs/common';
import { UploadModule } from './upload/upload.module';
import { DownloadModule } from './download/download.module';

@Module({
  imports: [UploadModule, DownloadModule],
})
export class FileModule {}
