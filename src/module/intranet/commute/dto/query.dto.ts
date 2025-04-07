import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserCommuteFilterDto {
  @ApiProperty({
    name: 'sDate',
    required: true,
    type: String,
    description: '시작 일자(기본: 현재 달의 1일)',
    example: '2025-01-01',
  })
  @IsNotEmpty()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자(기본: 현재 달의 마지막일)',
    example: '2025-01-31',
  })
  @IsNotEmpty()
  eDate: string;
}

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
