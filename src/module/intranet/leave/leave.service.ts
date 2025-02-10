import { BadRequestException, Injectable } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { LeaveRequestDto } from './dto/createLeave.dto';
import { ConfigService } from '@nestjs/config';
import { IntranetLeaveTypeEnum, NodeEnvEnum } from '../../../common/constant/enum';
import { AwsService } from '../../aws/aws.service';
import { LeaveImageInfo } from './interface/leave.interface';

@Injectable()
export class LeaveService {
  constructor(
    private readonly leaveRepository: LeaveRepository,
    private readonly awsService: AwsService,
    public readonly configService: ConfigService,
  ) {}

  async createLeave(
    dto: LeaveRequestDto,
    userIdx: number,
    manager: EntityManager,
    leaveImage?: Express.Multer.File,
  ): Promise<void> {
    const { leaveInfo, confirmPersonIdx } = dto;

    await Promise.all(
      leaveInfo.map(async (leave) => {
        const dateStringFormat: RegExp = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateStringFormat.test(leave.commuteDate)) {
          throw new BadRequestException('commuteDate는 0000-00-00 날짜 형식으로 입력해주세요');
        }
        if (!Object.values(IntranetLeaveTypeEnum).includes(leave.leaveType)) {
          throw new BadRequestException('올바른 휴가 유형을 입력해주세요.');
        }
        const commuteIdx: number = await this.leaveRepository.createLeave(leave, userIdx, confirmPersonIdx, manager);

        if (leaveImage) {
          const env: string = this.configService.get<string>('NODE_ENV');
          const rootDir: string = env === NodeEnvEnum.TEST ? 'TEST' : 'PROD';
          // 1. S3에 저장
          const { buffer, mimetype } = leaveImage;
          const bucketName: string = this.configService.get<string>('S3_BUCKET_NAME');
          const fileName: string = mimetype === 'application/pdf' ? 'proof.pdf' : `proof.${mimetype.split('/')[1]}`;
          const uploadS3FilePath: string = `${rootDir}/LEAVE/${commuteIdx}/${fileName}`;
          const imageUrl: string = await this.awsService.uploadImageToS3(
            bucketName,
            uploadS3FilePath,
            buffer,
            mimetype,
          );
          const imageInfo: LeaveImageInfo = {
            imageName: fileName,
            imageSize: leaveImage.size,
            imageUrl,
          };
          // 2. DB에 저장
          await this.leaveRepository.createLeaveImage(commuteIdx, imageInfo, manager);
        }
      }),
    );

    return;
  }
}
