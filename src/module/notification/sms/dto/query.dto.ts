import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UserSmsFilterDto {
  @ApiProperty({
    name: 'sDate',
    required: false,
    type: String,
    description: '발송 날짜 검색 시작일자',
    example: '2024-11-01',
  })
  @IsOptional()
  @IsDateString()
  sDate?: string;

  @ApiProperty({
    name: 'eDate',
    required: false,
    type: String,
    description: '발송 날짜 검색 종료일자',
    example: '2024-11-20',
  })
  @IsOptional()
  @IsDateString()
  eDate?: string;

  @ApiProperty({ name: 'toPhoneNumber', description: '수신 전화번호', type: String, required: false })
  @IsOptional()
  @IsString()
  toPhoneNumber?: string;

  @ApiProperty({ name: 'status', description: '메시지 상태', type: String, required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
