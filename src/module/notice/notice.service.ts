import { BadRequestException, Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { EntityManager } from 'typeorm';
import { PageNoDto } from '../../common/dto/pageNo.dto';
import { NoticeResult } from './interface/result.interface';
import { NoticeDetailInfo } from './interface/notice.interface';
import { UpdateNoticeDto } from './dto/updateNotice.dto';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { NodeEnvEnum } from '../../common/constant/enum';

@Injectable()
export class NoticeService {
  constructor(
    private readonly noticeRepository: NoticeRepostiory,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  async createNotice(
    noticeInfo: CreateNoticeDto,
    adminName: string,
    manager: EntityManager,
    noticeImage?: Express.Multer.File,
  ): Promise<void> {
    const noticeIdx: number = await this.noticeRepository.createNotice(noticeInfo, adminName, manager);

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
      // 2. DB에 저장
      await this.noticeRepository.updateNoticeImage(noticeIdx, imageUrl, manager);
    }

    return;
  }

  async getNoticeList({ pageNo, perPage }: PageNoDto): Promise<NoticeResult> {
    const noticeList: NoticeResult = await this.noticeRepository.getNoticeList(pageNo, perPage);

    return noticeList;
  }

  async getNoticeDetail(noticeIdx: number): Promise<NoticeDetailInfo> {
    const noticeInfo: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    const noticeDetail: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);

    return noticeDetail;
  }

  async updateNotice(
    adminName: string,
    noticeIdx: number,
    noticeDto: UpdateNoticeDto,
    manager: EntityManager,
    noticeImage?: Express.Multer.File,
  ): Promise<void> {
    delete noticeDto.noticeImage;
    if (noticeDto.imageUrl === null || !noticeDto.imageUrl) {
      noticeDto.imageUrl = null;
    }
    const noticeInfo: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }

    await this.noticeRepository.updateNotice(adminName, noticeIdx, noticeDto, manager);

    /*
     * 기존 이미지 삭제 및 새로운 이미지 추가 → imageUrl: null, noticeImage: any
     * 기존 이미지 없음 및 새로운 이미지 추가 → imageUrl: null, noticeImage: any
     * 기존 이미지 삭제(최종 이미지: 없음) → imageUrl: null
     * 기존 이미지 유지 → imageUrl: string
     * 기존 이미지 없음(최종 이미지: 없음) → imageUrl: null
     */

    /* 새로운 사진으로 변경할 경우 */
    if (noticeImage) {
      const env: string = this.configService.get<string>('NODE_ENV');
      const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
      const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
      const s3FilePath: string = `${rootDir}/NOTICE/${noticeIdx}`;
      // 1. 기존 이미지가 있었다면, S3에서 삭제
      if (noticeInfo.imageUrl) {
        const existingFileName: string = noticeInfo.imageUrl.split('/').pop();
        const existingFilePath: string = `${s3FilePath}/${existingFileName}`;
        await this.awsService.deleteS3Image(bucketName, existingFilePath);
      }
      // 2. 새 이미지 S3에 업로드
      noticeImage.originalname = Buffer.from(noticeImage.originalname, 'ascii').toString('utf8');
      const { buffer, mimetype, originalname } = noticeImage;
      const newFilePath: string = `${s3FilePath}/${originalname}`;
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, newFilePath, buffer, mimetype);
      // 3. DB 업데이트
      await this.noticeRepository.updateNoticeImage(noticeIdx, imageUrl, manager);
    }

    return;
  }

  async deleteNotice(noticeIdx: number, manager: EntityManager): Promise<void> {
    const noticeInfo: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!noticeInfo) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    /* DB 삭제 */
    await this.noticeRepository.deleteNotice(noticeIdx, manager);
    /* S3 삭제 */
    if (noticeInfo.imageUrl) {
      const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
      await this.awsService.deleteS3Image(bucketName, noticeInfo.imageUrl);
    }

    return;
  }
}
