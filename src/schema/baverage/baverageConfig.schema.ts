import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BaverageConfigDocument = HydratedDocument<BaverageConfig>;

@Schema({ collection: 'baverage_config', timestamps: true })
export class BaverageConfig {
  @Prop({ type: String, required: true })
  month: string;

  @Prop({ type: [String], required: true, default: [] })
  pickup: string[];

  @Prop({ type: String, required: true })
  dueDate: string;
}

export const BaverageConfigSchema = SchemaFactory.createForClass(BaverageConfig);
