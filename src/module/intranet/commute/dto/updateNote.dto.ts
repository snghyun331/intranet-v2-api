import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ type: String, description: '특이사항', required: true })
  @IsOptional()
  note: string | null;
}
