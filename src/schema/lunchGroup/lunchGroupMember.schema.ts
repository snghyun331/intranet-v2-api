import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LunchGroupMemberDocument = HydratedDocument<LunchGroupMember>;

@Schema({ collection: 'lunch_group_member', timestamps: true })
export class LunchGroupMember {
  @Prop({ type: Types.ObjectId, ref: 'LunchGroupConfig', required: true, index: true })
  configId: Types.ObjectId;

  @Prop({ type: Number, ref: 'User', required: true, index: true })
  userIdx: number;

  @Prop({ type: Number, required: true })
  groupNo: number;
}

export const LunchGroupMemberSchema = SchemaFactory.createForClass(LunchGroupMember);
