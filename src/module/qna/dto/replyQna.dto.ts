import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyQnaDto {
  @ApiProperty({ type: 'text', description: '문의 답변 내용', required: true })
  @IsNotEmpty({ message: '답변을 입력해주세요' })
  @IsString()
  replyText: string;
}
