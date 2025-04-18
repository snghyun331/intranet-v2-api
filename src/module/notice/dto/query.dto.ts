import { ApiProperty } from '@nestjs/swagger';

export class AdminNoticeFilterDto {
  @ApiProperty({ type: String, required: false, description: '제목 및 내용 검색' })
  searchWord?: string;
}
