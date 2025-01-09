import * as moment from 'moment';
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
    if (noticeImage) {
      const { buffer, mimetype, originalname } = noticeImage;
      const today: string = moment().utcOffset(9).format('YYYY-MM-DD');
      const uploadS3FilePath: string = `NOTICE/${today}/${originalname}`;
      const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
      const imageUrl: string = await this.awsService.uploadImageToS3(bucketName, uploadS3FilePath, buffer, mimetype);
      noticeInfo.imageUrl = imageUrl;
    }

    await this.noticeRepository.createNotice(noticeInfo, adminName, manager);

    return;
  }

  async getNoticeList({ pageNo, perPage }: PageNoDto): Promise<NoticeResult> {
    const noticeList: NoticeResult = await this.noticeRepository.getNoticeList(pageNo, perPage);

    return noticeList;
  }

  async getNoticeDetail(noticeIdx: number): Promise<NoticeDetailInfo> {
    const noticeCnt: number = await this.noticeRepository.getNoticeCnt(noticeIdx);
    if (noticeCnt < 1) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    const noticeDetail: NoticeDetailInfo = await this.noticeRepository.getNoticeByIdx(noticeIdx);

    return noticeDetail;
  }

  async updateNotice(
    adminName: string,
    noticeIdx: number,
    noticeInfo: UpdateNoticeDto,
    manager: EntityManager,
  ): Promise<void> {
    const noticeCnt: number = await this.noticeRepository.getNoticeCnt(noticeIdx);
    if (noticeCnt < 1) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    await this.noticeRepository.updateNotice(adminName, noticeIdx, noticeInfo, manager);

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
