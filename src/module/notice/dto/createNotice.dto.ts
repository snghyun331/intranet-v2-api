import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNoticeDto {
  @ApiProperty({ type: String, description: '제목(100자이내)', required: true })
  @IsNotEmpty({ message: '제목은 필수로 입력해주세요.' })
  @IsString()
  @MaxLength(100, { message: '제목은 100자 이내로 입력해주세요.' })
  title: string;

  @ApiProperty({ type: String, description: '내용', required: true })
  @IsNotEmpty({ message: '내용은 필수로 입력해주세요.' })
  @IsString()
  content: string;

  @ApiProperty({ type: String, format: 'binary', description: '첨부 이미지 파일', required: false })
  @IsOptional()
  noticeImage?: any;

  @IsOptional()
  imageUrl?: string;
}
