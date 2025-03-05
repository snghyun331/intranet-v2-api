import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LunchGroupConfigDocument = HydratedDocument<LunchGroupConfig>;

@Schema({ collection: 'lunch_group_config', timestamps: true })
export class LunchGroupConfig {
  @Prop({ type: Number, required: true }) // 총 인원
  total: number;

  @Prop({ type: Number, required: true }) // 최대 그룹 수
  maxGroup: number;

  @Prop({ type: Number, required: true }) // 그룹당 인원
  perGroup: number;

  @Prop({ type: Number, required: true }) // 추가 인원 그룹 수
  extraGroupCount: number;

  @Prop({ type: Date, required: true }) // 점심조 시작 일자
  sDate: Date;

  @Prop({ type: Date, required: true }) // 점심조 마감 일자
  eDate: Date;

  @Prop({ type: String, required: false }) // 점심조 관련 공지사항
  notice: string;
}

export const LunchGroupConfigSchema = SchemaFactory.createForClass(LunchGroupConfig);
