import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { AdminCommuteSortEnum } from '../enum/commute.enum';

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
    required: true,
    type: String,
    description: '시작 일자',
    example: '2025-01-01',
  })
  @IsNotEmpty()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자',
    example: '2025-01-31',
  })
  @IsNotEmpty()
  eDate: string;

  @ApiProperty({ type: String, required: false })
  @IsOptional()
  userName?: string;

  @ApiProperty({ type: 'enum', enum: AdminCommuteSortEnum, description: '정렬 기준', required: false })
  @IsOptional()
  @IsEnum(AdminCommuteSortEnum)
  sortby?: AdminCommuteSortEnum;
}
