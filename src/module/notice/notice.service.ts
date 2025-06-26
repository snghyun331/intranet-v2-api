import { BadRequestException, Injectable } from '@nestjs/common';
import { NoticeRepostiory } from './repository/notice.repository';
import { CreateNoticeDto } from './dto/createNotice.dto';
import { PageNoDto } from '@common/dto/pageNo.dto';
import { NoticeImageInfo } from './interface/notice.interface';
import { UpdateNoticeDto } from './dto/updateNotice.dto';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';
import { NodeEnvEnum } from '@common/constant/enum';
import { Transactional } from 'typeorm-transactional';
import { AdminNoticeFilterDto, UserNoticeFilterDto } from './dto/query.dto';
import { NoticeCategoryEnum } from './constant/enum';
import { removeDuplicateIdxs } from '../../common/utils/utility';

@Injectable()
export class NoticeService {
  constructor(
    private readonly noticeRepository: NoticeRepostiory,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  @Transactional()
  async createNoticeForUser(
    noticeInfo: CreateNoticeDto,
    userName: string,
    noticeImage?: Express.Multer.File,
  ): Promise<void> {
    if (noticeInfo.category === NoticeCategoryEnum.NOTICE) {
      throw new BadRequestException('공지사항 카테고리는 관리자만 작성할 수 있습니다.');
    }
    const { ccUserIdxs, attendeeUserIdxs, ...newNoticeInfo } = noticeInfo;
    const noticeIdx: number = await this.noticeRepository.createNotice(newNoticeInfo, userName);

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

    /* 참석자 모두 저장 */
    if (attendeeUserIdxs !== null && attendeeUserIdxs !== undefined) {
      await this.noticeRepository.createNoticeAttendeeList(noticeIdx, attendeeUserIdxs);
    }
    /* 참조자 모두 저장 */
    if (ccUserIdxs !== null && ccUserIdxs !== undefined) {
      // 참석자는 참조자로 등록 X
      const removeDuplicateCCUserIdxs: number[] = removeDuplicateIdxs(attendeeUserIdxs, ccUserIdxs);
      await this.noticeRepository.createNoticeCCUserList(noticeIdx, removeDuplicateCCUserIdxs);
    }

    return;
  }

  @Transactional()
  async createNoticeForAdmin(
    noticeInfo: CreateNoticeDto,
    adminName: string,
    noticeImage?: Express.Multer.File,
  ): Promise<void> {
    const { ccUserIdxs, attendeeUserIdxs, ...newNoticeInfo } = noticeInfo;
    const noticeIdx: number = await this.noticeRepository.createNotice(newNoticeInfo, adminName);

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

    /* 참석자 모두 저장 */
    if (attendeeUserIdxs !== null && attendeeUserIdxs !== undefined) {
      await this.noticeRepository.createNoticeAttendeeList(noticeIdx, attendeeUserIdxs);
    }
    /* 참조자 모두 저장 */
    if (ccUserIdxs !== null && ccUserIdxs !== undefined) {
      // 참석자는 참조자로 등록 X
      const removeDuplicateCCUserIdxs: number[] = removeDuplicateIdxs(attendeeUserIdxs, ccUserIdxs);
      await this.noticeRepository.createNoticeCCUserList(noticeIdx, removeDuplicateCCUserIdxs);
    }

    return;
  }

  async getNoticeListForUser({ pageNo, perPage }: PageNoDto, filterInfo: UserNoticeFilterDto, userIdx: number) {
    const { totalPage, total, notices } = await this.noticeRepository.getNoticeListForUser(
      pageNo,
      perPage,
      filterInfo,
      userIdx,
    );

    /* noticeIdx 기준 그룹화 + 참조자 및 참석자 정보 합치기 */
    const groupedNotices = await this.groupByNoticeIdxForList(notices);

    const result = groupedNotices.map((notice) => ({
      ...notice,
      isNew: notice.isNew === 1 ? true : false,
    }));

    return { totalPage, total, result };
  }

  async getNoticeListForAdmin({ pageNo, perPage }: PageNoDto, filterInfo?: AdminNoticeFilterDto) {
    const { totalPage, total, notices } = await this.noticeRepository.getNoticeListForAdmin(
      pageNo,
      perPage,
      filterInfo,
    );

    /* noticeIdx 기준 그룹화 + 참조자 및 참석자 정보 합치기 */
    const groupedNotices = await this.groupByNoticeIdxForList(notices);

    return { totalPage, total, result: groupedNotices };
  }

  private async groupByNoticeIdxForList(rows: any[]) {
    return rows.reduce((acc, row) => {
      // 기존 noticeIdx가 있는지 확인
      const existing = acc.find((item: any) => item.noticeIdx === row.noticeIdx);

      const attendeeInfo = {
        attendeeUserIdx: row.attendeeUserIdx,
        attendeeUserName: row.attendeeUserName,
      };
      const ccUserInfo = {
        ccUserIdx: row.ccUserIdx,
        ccUserName: row.ccUserName,
      };

      if (existing) {
        // 같은 noticeIdx attendeeInfo 리스트에 추가
        if (row.approverIdx) {
          const isIdxAlreadyExists = existing.attendeeInfo.some(
            (user: any) => user.attendeeUserIdx === row.attendeeUserIdx,
          );
          if (!isIdxAlreadyExists) {
            existing.attendeeInfo.push(attendeeInfo);
          }
        }
        // 같은 noticeIdx ccUserInfo 리스트에 추가
        if (row.ccUserIdx) {
          const isIdxAlreadyExists = existing.ccUserInfo.some((user: any) => user.ccUserIdx === row.ccUserIdx);
          if (!isIdxAlreadyExists) {
            existing.ccUserInfo.push(ccUserInfo);
          }
        }
      } else {
        // 새로운 noticeIdx 새로운 객체 생성
        acc.push({
          noticeIdx: row.noticeIdx,
          title: row.title,
          place: row.place,
          useCarYN: row.useCarYN,
          creatorName: row.creatorName,
          category: row.category,
          startDate: row.startDate,
          endDate: row.endDate,
          createdAt: row.createdAt,
          attendeeInfo: row.attendeeUserIdx ? [attendeeInfo] : [],
          ccUserInfo: row.ccUserIdx ? [ccUserInfo] : [],
        });
      }
      return acc;
    }, []);
  }

  async getNoticeDetailForUser(noticeIdx: number, userIdx: number) {
    const notices = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!notices) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }
    console.log(notices);

    /* noticeIdx 기준 그룹화 + 참조자 및 참석자 정보 합치기 */
    const groupedNotices = await this.groupByNoticeIdxForDetail(notices);

    // 마지막 확인시간 업데이트
    await this.noticeRepository.updateLastNoticeCheckedAt(noticeIdx, userIdx);

    return groupedNotices;
  }

  async getNoticeDetailForAdmin(noticeIdx: number) {
    const notices = await this.noticeRepository.getNoticeByIdx(noticeIdx);
    if (!notices) {
      throw new BadRequestException('존재하지 않거나 삭제된 공지사항 입니다.');
    }

    /* noticeIdx 기준 그룹화 + 참조자 및 참석자 정보 합치기 */
    const groupedNotices = await this.groupByNoticeIdxForDetail(notices);

    return groupedNotices;
  }

  private async groupByNoticeIdxForDetail(row: any) {
    const attendeeInfo = {
      attendeeUserIdx: row.attendeeUserIdx,
      attendeeUserName: row.attendeeUserName,
    };
    const ccUserInfo = {
      ccUserIdx: row.ccUserIdx,
      ccUserName: row.ccUserName,
    };

    const result = {
      noticeIdx: row.noticeIdx,
      title: row.title,
      content: row.content,
      place: row.place,
      useCarYN: row.useCarYN,
      creatorName: row.creatorName,
      lastEditorName: row.lastEditorName,
      category: row.category,
      startDate: row.startDate,
      endDate: row.endDate,
      createdAt: row.createdAt,
      udpatedAt: row.udpatedAt,
      imageIdx: row.imageIdx,
      imageName: row.imageName,
      imageSize: row.imageSize,
      imageUrl: row.imageUrl,
      attendeeInfo: row.attendeeUserIdx ? [attendeeInfo] : [],
      ccUserInfo: row.ccUserIdx ? [ccUserInfo] : [],
    };

    return result;
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

  async hasNewNotice(userIdx: number): Promise<boolean> {
    const newNoticeCnt: number = await this.noticeRepository.getNewNoticeCount(userIdx);
    const hasNew: boolean = newNoticeCnt > 0;

    return hasNew;
  }
}
