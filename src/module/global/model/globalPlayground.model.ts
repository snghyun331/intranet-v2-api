import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../schema/user/user.schema';
import { SetUser } from '../../user/interface/user.interface';

@Injectable()
export class GlobalPlayGroundModel {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async createUser(userIdx: number, { userName }: SetUser): Promise<void> {
    await this.userModel.create({ _id: userIdx, userName });

    return;
  }

  async updateUser(userIdx: number, updateValue: SetUser): Promise<void> {
    await this.userModel.updateOne({ _id: userIdx }, { $set: updateValue });

    return;
  }
}
