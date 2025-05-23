import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type LunchGroupConfigDocument = HydratedDocument<LunchGroupConfig>;

@Schema({ collection: 'lunch_group_config', timestamps: true })
export class LunchGroupConfig {
  @Prop({ type: Number, required: true }) // 총 인원
  total: number;

  @Prop({ type: Number, required: true }) // 최대 그룹 수
  totalGroups: number;

  @Prop({ type: Number, required: true }) // 그룹당 인원
  perGroup: number;

  @Prop({
    type: [
      { groupNo: { type: Number, required: true }, availMemberCount: { type: Number, required: true }, _id: false },
    ],
    required: true,
  }) // 그룹 정보
  groupInfo: Array<{ groupNo: number; availMemberCount: number }>;

  @Prop({ type: String, required: true }) // 점심조 시작 일자
  sDate: string;

  @Prop({ type: String, required: true }) // 점심조 마감 일자
  eDate: string;

  @Prop({ type: String, required: false }) // 점심조 관련 공지사항
  notice: string;
}

export const LunchGroupConfigSchema = SchemaFactory.createForClass(LunchGroupConfig);
