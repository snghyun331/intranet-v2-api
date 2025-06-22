import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class AdminNoticeFilterDto {
  @ApiProperty({ type: String, required: false, description: '제목 및 내용 검색' })
  searchWord?: string;

  @ApiProperty({ type: String, required: false, description: '게시 연도' })
  year?: string;

  @ApiProperty({ type: String, required: false, description: '게시 월' })
  month?: string;

  @ApiProperty({
    type: String,
    name: 'category',
    required: false,
    description: '카테고리(개별 및 복수)',
    example: 'notice,etc',
  })
  @IsOptional()
  @Transform(({ value }) =>
    decodeURIComponent(value)
      .split(',')
      .map((item) => item.trim().toUpperCase()),
  ) // 공백 제거 후 대문자로 변환
  category?: string[];
}

export class UserNoticeFilterDto {
  @ApiProperty({ type: String, required: false, description: '제목 및 내용 검색' })
  searchWord?: string;

  @ApiProperty({ type: String, required: false, description: '게시 연도' })
  year?: string;

  @ApiProperty({ type: String, required: false, description: '게시 월' })
  month?: string;

  @ApiProperty({
    type: String,
    name: 'category',
    required: false,
    description: '카테고리(개별 및 복수)',
    example: 'notice,etc',
  })
  @IsOptional()
  @Transform(({ value }) =>
    decodeURIComponent(value)
      .split(',')
      .map((item) => item.trim().toUpperCase()),
  ) // 공백 제거 후 대문자로 변환
  category?: string[];
}
