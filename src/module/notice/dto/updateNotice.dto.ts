import { PickType } from '@nestjs/swagger';
import { CreateNoticeDto } from './createNotice.dto';

export class UpdateNoticeDto extends PickType(CreateNoticeDto, ['title', 'content'] as const) {}
