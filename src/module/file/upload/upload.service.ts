import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../../aws/aws.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}
}
