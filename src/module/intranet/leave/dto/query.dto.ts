import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class AdminLeaveFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '회계연도', type: String, example: '2025' })
  year: string;

  @ApiProperty({ name: 'userName', description: '검색 이름', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;
}

export class AdminLeaveDetailFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '검색연도', type: String, example: '2025' })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({ name: 'month', required: true, description: '검색월', type: String, example: '2' })
  @IsNotEmpty()
  @IsString()
  month: string;

  @ApiProperty({
    name: 'leaveTypeIdx',
    required: false,
    description: '분류',
    type: Number,
    example: 6,
  })
  @IsOptional()
  @IsNumber()
  leaveTypeIdx?: number;
}

export class UserLeaveDetailFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '검색연도', type: String, example: '2025' })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({ name: 'month', required: true, description: '검색월', type: String, example: '2' })
  @IsNotEmpty()
  @IsString()
  month: string;

  @ApiProperty({
    name: 'leaveTypeIdx',
    required: false,
    description: '분류',
    type: Number,
    example: 6,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  leaveTypeIdx?: number;
}
