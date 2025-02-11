import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateNoteDto {
  @ApiProperty({ type: String, description: '특이사항', required: false })
  @IsOptional()
  note: string | null;
}
