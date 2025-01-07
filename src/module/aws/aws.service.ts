import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class AwsService {
  s3Client: S3Client;

  constructor(private configService: ConfigService) {
    // AWS S3 클라이언트 초기화. 환경 설정 정보를 사용하여 AWS 리전, Access Key, Secret Key를 설정.
    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async uploadImageToS3(bucketName: string, filePath: string, buffer: Buffer, mimeType: string): Promise<string> {
    const command: PutObjectCommand = new PutObjectCommand({
      Bucket: bucketName, // S3 버킷 이름
      Key: filePath, // 업로드될 파일의 경로 및 이름
      Body: buffer, // 업로드할 파일(버퍼형식)
      ACL: 'public-read', // 파일 접근 권한
      ContentType: mimeType, // 파일 타입
      ContentDisposition: 'inline',
    });
    // 생성된 명령을 S3 클라이언트에 전달하여 이미지 업로드
    await this.s3Client.send(command);
    // 업로드된 이미지의 URL을 반환
    const s3Region: string = this.configService.get<string>('S3_REGION');

    return `https://${bucketName}.s3.${s3Region}.amazonaws.com/${filePath}`;
  }

  async deleteS3Image(bucketName: string, filePath: string): Promise<void> {
    const command: DeleteObjectCommand = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });
    await this.s3Client.send(command);

    return;
  }
}
