import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoticeCategoryEnum } from '../constant/enum';

export class CreateNoticeDto {
  @ApiProperty({ type: String, description: '제목(100자이내)', required: true })
  @IsNotEmpty({ message: '제목은 필수로 입력해주세요.' })
  @IsString()
  @MaxLength(100, { message: '제목은 100자 이내로 입력해주세요.' })
  title: string;

  @ApiProperty({ type: 'enum', enum: NoticeCategoryEnum, description: '카테고리', required: true })
  @IsNotEmpty({ message: '카테고리는 필수로 입력해주세요.' })
  @IsString()
  category: string;

  @ApiProperty({
    type: String,
    description: '게시 시작일',
    required: false,
    example: '2024-01-01',
  })
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    type: String,
    description: '게시 종료일',
    required: false,
    example: '2024-12-31',
  })
  @IsOptional()
  endDate?: string;

  @ApiProperty({ type: String, description: '내용', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ type: String, format: 'binary', description: '첨부 이미지 파일', required: false })
  @IsOptional()
  noticeImage?: any;

  @IsOptional()
  imageUrl?: string;
}
