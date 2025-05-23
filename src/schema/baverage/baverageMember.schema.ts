import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BaverageMemberDocument = HydratedDocument<BaverageMember>;

@Schema({ collection: 'baverage_member', timestamps: true })
export class BaverageMember {
  @Prop({ type: Types.ObjectId, ref: 'BaverageConfig', required: true, index: true })
  configId: Types.ObjectId;

  @Prop({ type: String, required: true })
  userName: string;

  @Prop({ type: String, required: false })
  baverage: string | null;
}

export const BaverageMemberSchema = SchemaFactory.createForClass(BaverageMember);
