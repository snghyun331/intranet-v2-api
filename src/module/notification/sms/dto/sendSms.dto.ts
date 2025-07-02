import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { SMSTagEnum } from '../../../../common/constant/enum';

export class SendSmsDto {
  @ApiProperty({ type: String, description: '발신 번호', required: true })
  @IsNotEmpty()
  @IsString()
  fromPhoneNumber: string;

  @ApiProperty({ type: String, description: '메시지', required: true })
  @IsNotEmpty()
  message: string;

  @ApiProperty({ type: Array, description: '수신 번호 리스트', required: true })
  @IsNotEmpty()
  @IsArray()
  toPhoneNumbers: string[];

  @ApiProperty({ type: Number, description: '총 발송 대상 수', required: true })
  @IsNotEmpty()
  @IsNumber()
  totalCount: number;

  @ApiProperty({ type: 'enum', enum: SMSTagEnum, description: 'SMS 태그', required: true })
  @IsNotEmpty()
  @IsEnum(SMSTagEnum)
  smsTag: SMSTagEnum;
}
