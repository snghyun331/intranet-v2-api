import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommuteEntity } from '../../../../entity/intranet/commute/commute.entity';
import { EntityManager, InsertResult, Repository } from 'typeorm';
import { LeaveDetailDto } from '../dto/createLeave.dto';
import { LeaveImageInfo } from '../interface/leave.interface';
import { ImageEntity } from '../../../../entity/image/image.entity';
import { CommuteHasImageEntity } from '../../../../entity/image/commuteHasImage.entity';

@Injectable()
export class LeaveRepository {
  constructor(@InjectRepository(CommuteEntity) private readonly commuteModel: Repository<CommuteEntity>) {}

  async createLeave(
    leaveInfo: LeaveDetailDto,
    userIdx: number,
    confirmPersonIdx: number,
    manager: EntityManager,
  ): Promise<number> {
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(CommuteEntity)
      .values({ ...leaveInfo, confirmPersonIdx, userIdx })
      .execute();

    const commuteIdx: number = result.identifiers[0].commuteIdx;

    return commuteIdx;
  }

  async createLeaveImage(commuteIdx: number, imageInfo: LeaveImageInfo, manager: EntityManager): Promise<void> {
    /* image entity */
    const result: InsertResult = await manager
      .createQueryBuilder()
      .insert()
      .into(ImageEntity)
      .values(imageInfo)
      .execute();

    const imageIdx: number = result.identifiers[0].imageIdx;

    /* leave_has_image entity */
    await manager.createQueryBuilder().insert().into(CommuteHasImageEntity).values({ commuteIdx, imageIdx }).execute();
  }
}
