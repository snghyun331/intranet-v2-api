import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ type: String, description: '조기퇴근 사유', required: true })
  @IsOptional()
  earlyLeaveReason: string | null;

  @ApiProperty({ type: String, description: '근태 수정 사유', required: true })
  @IsOptional()
  updateReason: string | null;

  @ApiProperty({ type: String, description: '특이사항', required: true })
  @IsOptional()
  note: string | null;
}
