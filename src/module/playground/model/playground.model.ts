import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { LunchGroupConfig, LunchGroupConfigDocument } from '@schema/lunchGroup/lunchGroupConfig.schema';
import { HydratedDocument, Model, Types } from 'mongoose';
import { SetLunchGroup } from '../interface/lunchGroup.interface';
import { LunchGroupMember, LunchGroupMemberDocument } from '@schema/lunchGroup/lunchGroupMember.schema';
import { BaverageConfig, BaverageConfigDocument } from '../../../schema/baverage/baverageConfig.schema';
import { BaverageMember, BaverageMemberDocument } from '../../../schema/baverage/baverageMember.schema';
import { BaverageEnum } from '../enum/playground.enum';

@Injectable()
export class PlayGroundModel {
  constructor(
    @InjectModel(LunchGroupConfig.name) private readonly lunchGroupConfigModel: Model<LunchGroupConfigDocument>,
    @InjectModel(LunchGroupMember.name) private readonly lunchGroupMemberModel: Model<LunchGroupMemberDocument>,
    @InjectModel(BaverageConfig.name) private readonly baverageConfigModel: Model<BaverageConfigDocument>,
    @InjectModel(BaverageMember.name) private readonly baverageMemberModel: Model<BaverageMemberDocument>,
  ) {}

  async createLunchGroupConfig(insertValue: SetLunchGroup): Promise<void> {
    await this.lunchGroupConfigModel.create(insertValue);

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

  async findBaverageConfigByMonth(month: string): Promise<HydratedDocument<BaverageConfig>> {
    const result = await this.baverageConfigModel
      .findOne({ month })
      .select({ month: 1, pickup: 1, dueDate: 1 })
      .lean()
      .exec();

    return result;
  }

  async getBaverageCountStats(configId: object) {
    const raw = await this.baverageMemberModel.aggregate([
      { $match: { configId } },
      { $group: { _id: '$baverage', count: { $sum: 1 } } },
      { $project: { _id: 0, baverage: '$_id', count: 1 } },
    ]);

    const result = raw.map((item) => ({
      baverage: item.baverage ?? BaverageEnum.NONE,
      count: item.count,
    }));

    return result;
  }

  async getBaverageDetails(configId: object) {
    const result: HydratedDocument<BaverageMember>[] = await this.baverageMemberModel
      .find({ configId })
      .select({ userName: 1, baverage: 1, _id: 0 })
      .exec();

    return result;
  }

  async getMyBaverage(configId: object, userName: string) {
    const result = await this.baverageMemberModel
      .findOne({ configId, userName })
      .select({ userName: 1, baverage: 1 })
      .exec();

    return result;
  }

  async updateBaverage(id: string, userName: string, baverage: string): Promise<void> {
    // configId는 ObjectId로 변환
    const configId = new Types.ObjectId(id);
    await this.baverageMemberModel.updateOne({ configId, userName }, { $set: { baverage } });

    return;
  }
}
