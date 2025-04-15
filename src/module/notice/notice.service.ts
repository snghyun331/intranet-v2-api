import { BadRequestException, Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { NoticeImageInfo } from './interface/notice.interface';
import { UpdateNoticeDto } from './dto/updateNotice.dto';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { NodeEnvEnum } from '../../common/constant/enum';
import { Transactional } from 'typeorm-transactional';

@Injectable()
export class NoticeService {
  constructor(
    private readonly noticeRepository: NoticeRepostiory,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  @Transactional()
  async createNotice(noticeInfo: CreateNoticeDto, adminName: string, noticeImage?: Express.Multer.File): Promise<void> {
    const noticeIdx: number = await this.noticeRepository.createNotice(noticeInfo, adminName);

    /* 첨부 이미지가 있다면 */
    if (noticeImage) {
      const env: string = this.configService.get<string>('NODE_ENV');
      const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
      // 1. S3에 저장
      noticeImage.originalname = Buffer.from(noticeImage.originalname, 'ascii').toString('utf8');
      const { buffer, mimetype, originalname } = noticeImage;
      const uploadS3FilePath: string = `${rootDir}/NOTICE/${noticeIdx}/${originalname}`;
      const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, uploadS3FilePath, buffer, mimetype);
      const imageInfo: NoticeImageInfo = { imageName: noticeImage.originalname, imageSize: noticeImage.size, imageUrl };
      // 2. DB에 저장
      await this.noticeRepository.createNoticeImage(noticeIdx, imageInfo);
    }

    return;
  }

  async getNoticeList({ pageNo, perPage }: PageNoDto) {
    const noticeList = await this.noticeRepository.getNoticeList(pageNo, perPage);

    return noticeList;
  }

  async getNoticeDetail(noticeIdx: number) {
    const noticeInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }

    return noticeInfo;
  }

  @Transactional()
  async updateNotice(
    adminName: string,
    noticeIdx: number,
    noticeDto: UpdateNoticeDto,
    noticeImage?: Express.Multer.File,
  ): Promise<void> {
    delete noticeDto.noticeImage;
    /*
     * 기존 이미지 삭제 및 새로운 이미지 추가 → imageUrl: X, noticeImage: O
     * 기존 이미지 삭제(최종 이미지: 없음) → imageUrl: X
     * 기존 이미지 없음 및 새로운 이미지 추가 → imageUrl: X, noticeImage: O
     * 기존 이미지 없음(최종 이미지: 없음) → imageUrl: X
     * 기존 이미지 유지 → imageUrl: string
     */

    const noticeInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }

    const env: string = this.configService.get<string>('NODE_ENV');
    const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
    const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
    const s3FilePath: string = `${rootDir}/NOTICE/${noticeIdx}`;

    /* 기존 이미지 삭제 로직 */
    if (noticeInfo.imageIdx && !noticeDto.imageUrl) {
      // S3 이미지 삭제
      const existingFileName: string = noticeInfo.imageUrl.split('/').pop();
      const existingFilePath: string = `${s3FilePath}/${existingFileName}`;
      await this.awsService.deleteS3Image(bucketName, existingFilePath);
      // DB 처리
      if (noticeImage) {
        // 기존 이미지 삭제 및 새로운 이미지 추가
        await this.noticeRepository.updateImageDataToNull(noticeInfo.imageIdx);
      } else {
        // 기존 이미지 삭제만
        await this.noticeRepository.deleteNoticeImage(noticeInfo.imageIdx);
      }
    }

    await this.noticeRepository.updateNotice(adminName, noticeIdx, noticeDto);

    /* 새로운 사진으로 변경할 경우 */
    if (noticeImage) {
      // 1. 새 이미지 S3에 업로드
      noticeImage.originalname = Buffer.from(noticeImage.originalname, 'ascii').toString('utf8');
      const { buffer, mimetype, originalname } = noticeImage;
      const newFilePath: string = `${s3FilePath}/${originalname}`;
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, newFilePath, buffer, mimetype);
      // 2. 이미지 정보 생성
      const imageInfo: NoticeImageInfo = { imageName: noticeImage.originalname, imageSize: noticeImage.size, imageUrl };
      // 3. DB 업데이트
      if (noticeInfo.imageIdx) {
        // 기존 이미지가 있으면 업데이트
        await this.noticeRepository.updateNoticeImage(noticeInfo.imageIdx, imageInfo);
      } else {
        // 기존 이미지가 없으면 생성
        await this.noticeRepository.createNoticeImage(noticeIdx, imageInfo);
      }
    }

    return;
  }

  @Transactional()
  async deleteNotice(noticeIdx: number): Promise<void> {
    const noticeInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    // DB 삭제
    await this.noticeRepository.deleteNotice(noticeIdx);

    /* 이미지가 있다면 */
    if (noticeInfo.imageIdx) {
      // DB 삭제
      await this.noticeRepository.deleteNoticeImage(noticeInfo.imageIdx);
      // S3 삭제
      const env: string = this.configService.get<string>('NODE_ENV');
      const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
      const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
      const s3FilePath: string = `${rootDir}/NOTICE/${noticeIdx}`;

      const existingFileName: string = noticeInfo.imageUrl.split('/').pop();
      const existingFilePath: string = `${s3FilePath}/${existingFileName}`;
      await this.awsService.deleteS3Image(bucketName, existingFilePath);
    }

    return;
  }
}
