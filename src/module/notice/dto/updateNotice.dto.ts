import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateNoticeDto } from './createNotice.dto';

export class UpdateNoticeDto extends PickType(CreateNoticeDto, [
  'title',
  'content',
  'category',
  'place',
  'useCar',
  'startDate',
  'endDate',
  'noticeImage',
  'ccUserIdxs',
  'attendeeUserIdxs',
] as const) {
  @ApiProperty({ type: String, description: '기존 이미지 URL', required: false })
  imageUrl: string | null;
}
