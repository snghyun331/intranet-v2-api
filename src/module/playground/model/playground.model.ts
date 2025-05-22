import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigDocument } from '@schema/lunchGroup/lunchGroupConfig.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SetLunchGroup } from '../interface/lunchGroup.interface';
import { LunchGroupMember, LunchGroupMemberDocument } from '@schema/lunchGroup/lunchGroupMember.schema';
import { BaverageConfig, BaverageConfigDocument } from '../../../schema/baverage/baverageConfig.schema';
import { BaverageMember, BaverageMemberDocument } from '../../../schema/baverage/baverageMember.schema';

@Injectable()
export class PlayGroundModel {
  constructor(
    @InjectModel(LunchGroupConfig.name) private readonly lunchGroupConfigModel: Model<LunchGroupConfigDocument>,
    @InjectModel(LunchGroupMember.name) private readonly lunchGroupMemberModel: Model<LunchGroupMemberDocument>,
    @InjectModel(BaverageConfig.name) private readonly baverageConfigModel: Model<BaverageConfigDocument>,
    @InjectModel(BaverageMember.name) private readonly baverageMemberModel: Model<BaverageMemberDocument>,
  ) {}

  async createLunchGroupConfig(insertValue: SetLunchGroup): Promise<void> {
    await this.lunchGroupConfigModel.create([insertValue]);

    return;
  }

  async findAvailableLunchGroupConfig(nowDate: string): Promise<HydratedDocument<LunchGroupConfig>> {
    const result: HydratedDocument<LunchGroupConfig> = await this.lunchGroupConfigModel.findOne({
      eDate: { $gte: nowDate },
    });

    return result;
  }

  async checkUserAssignedToLunchGroup(configId: object, userName: string): Promise<boolean> {
    const result = await this.lunchGroupMemberModel.findOne({ configId, userName });

    return result ? true : false;
  }

  async getUserCountByLunchGroup(configId: object) {
    const result = await this.lunchGroupMemberModel.aggregate([
      { $match: { configId } },
      { $group: { _id: '$groupNo', count: { $sum: 1 } } },
    ]);

    return result;
  }

  async addUserInLunchGroup(configId: object, groupToAssign: number, userName: string) {
    await this.lunchGroupMemberModel.create([{ configId, groupNo: groupToAssign, userName }]);

    return;
  }

  async deleteLunchGroupConfig(configId: object): Promise<void> {
    await this.lunchGroupConfigModel.findOneAndDelete({ _id: configId });
    await this.lunchGroupMemberModel.deleteMany({ configId });

    return;
  }

  async findLunchGroupMembers(configId: object): Promise<HydratedDocument<LunchGroupMember>[]> {
    const result: HydratedDocument<LunchGroupMember>[] = await this.lunchGroupMemberModel.find({ configId });

    return result;
  }

  async findLatestLunchGroupConfig(): Promise<HydratedDocument<LunchGroupConfig>> {
    const result: HydratedDocument<LunchGroupConfig> = await this.lunchGroupConfigModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    return result;
  }

  async createMonthlyBaverageConfig(insertValue: BaverageConfig): Promise<Types.ObjectId> {
    const result = await this.baverageConfigModel.create(insertValue);
    const id: Types.ObjectId = result._id;

    return id;
  }

  async createBaverageMember(insertValues: BaverageMember[]): Promise<void> {
    await this.baverageMemberModel.insertMany(insertValues);

    return;
  }
}
