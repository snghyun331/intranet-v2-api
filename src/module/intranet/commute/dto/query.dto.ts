import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class AdminCommuteFilterDto {
  @ApiProperty({
    name: 'sDate',
    required: false,
    type: String,
    description: '시작 일자',
    example: '2025-01-01',
  })
  @IsOptional()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: false,
    type: String,
    description: '종료 일자',
    example: '2025-01-31',
  })
  @IsOptional()
  eDate: string;
}
