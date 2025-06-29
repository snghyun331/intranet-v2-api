import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SmsMessageStatusEnum } from '../../../../common/constant/enum';

export class UserSmsFilterDto {
  @ApiProperty({
    required: false,
    type: String,
    description: '발송 날짜 검색 시작일자',
    example: '2024-11-01',
  })
  @IsOptional()
  @IsDateString()
  sDate?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: '발송 날짜 검색 종료일자',
    example: '2024-11-20',
  })
  @IsOptional()
  @IsDateString()
  eDate?: string;

  @ApiProperty({ description: '수신 전화번호', type: String, required: false })
  @IsOptional()
  @IsString()
  toPhoneNumber?: string;

  @ApiProperty({ description: '메시지 상태', type: 'enum', enum: SmsMessageStatusEnum, required: false })
  @IsOptional()
  @IsEnum(SmsMessageStatusEnum)
  status?: string;
}
