import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { UploadImgDto } from './dto/uploadImgDto';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../../aws/aws.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  async uploadNoticeImage(noticeImage: UploadImgDto): Promise<string> {
    const { buffer, mimetype, originalname } = noticeImage;
    const today: string = moment().utcOffset(9).format('YYYY-MM-DD');
    const uploadS3FilePath: string = `NOTICE/${today}/${originalname}`;
    const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
    const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, uploadS3FilePath, buffer, mimetype);

    return imageUrl;
  }
}
