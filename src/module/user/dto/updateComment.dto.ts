import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ type: String, description: '직원 특이사항', required: false })
  @IsOptional()
  comment: string | null;
}
