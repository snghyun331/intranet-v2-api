import { ApiProperty } from '@nestjs/swagger';

export class AdminNoticeFilterDto {
  @ApiProperty({ type: String, required: false, description: '제목 검색' })
  title?: string;
}
