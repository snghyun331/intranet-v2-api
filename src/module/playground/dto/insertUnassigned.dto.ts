import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class InsertUnAssignedUserDto {
  @ApiProperty({ type: Array, description: '배정할 인원명', example: ['이승현', '김현민'], required: true })
  @IsNotEmpty()
  @IsArray()
  targetUserNames: string[];
}
