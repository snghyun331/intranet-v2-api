import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ type: String, description: '비고', example: '11월 22일 퇴사예정', required: true })
  @IsNotEmpty({ message: '비고를 입력해주세요' })
  @IsString()
  note: string;
}
