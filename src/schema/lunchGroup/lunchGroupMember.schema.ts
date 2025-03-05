import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LunchGroupMemberDocument = HydratedDocument<LunchGroupMember>;

@Schema({ collection: 'lunch_group_member', timestamps: true })
export class LunchGroupMember {
  @Prop({ type: Number, index: true, required: true })
  groupNo: number;

  @Prop({ type: String, unique: true, required: true })
  userName: number;
}

export const LunchGroupMemberSchema = SchemaFactory.createForClass(LunchGroupMember);
