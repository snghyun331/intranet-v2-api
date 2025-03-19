import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as moment from 'moment';

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

  @Prop({ type: String, required: true }) // 점심조 시작 일자
  sDate: string;

  @Prop({ type: String, required: true }) // 점심조 마감 일자
  eDate: string;

  @Prop({ type: String, required: false }) // 점심조 관련 공지사항
  notice: string;

  @Prop({ type: Date, required: false, expires: 0 }) // expireAt에 자동 삭제되는 TTL 적용
  expireAt: Date;
}

export const LunchGroupConfigSchema = SchemaFactory.createForClass(LunchGroupConfig);

// TTL 인덱스 설정
LunchGroupConfigSchema.index({ createdAt: 1 }, { expireAfterSeconds: 0 });
// TTL 인덱스를 expireAt 필드에 적용 (eDate를 기반으로 expireAt 값을 설정하는 pre-save hook 추가)
LunchGroupConfigSchema.pre('save', function (next) {
  const doc = this as LunchGroupConfigDocument;
  doc.expireAt = moment(doc.eDate).utcOffset(9).endOf('day').toDate(); // eDate 값을 Date형으로 변환
  next();
});
