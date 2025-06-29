import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { NoticeCategoryEnum } from '../constant/enum';
import { Transform } from 'class-transformer';

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

  @ApiProperty({ type: String, description: '제목(100자이내)', required: false })
  @IsOptional()
  @IsString()
  place: string;

  @ApiProperty({ type: String, description: '차량', required: false })
  @IsOptional()
  @IsString()
  useCar: string | null;

  @ApiProperty({ type: Array, description: '참조 유저IDX (없으면 null)', example: [2], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    } else if (value === null) {
      return null;
    }
    return value;
  })
  ccUserIdxs?: number[] | null;

  @ApiProperty({ type: Array, description: '참석자 유저IDX (없으면 null)', example: [2], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    } else if (value === null) {
      return null;
    }
    return value;
  })
  attendeeUserIdxs?: number[] | null;

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
