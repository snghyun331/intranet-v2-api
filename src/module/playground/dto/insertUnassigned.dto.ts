import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class InsertUnAssignedUserDto {
  @ApiProperty({ type: Array, description: '배정할 인원Idx', example: [1, 2], required: true })
  @IsNotEmpty()
  @IsArray()
  targetUserIdxs: number[];
}
