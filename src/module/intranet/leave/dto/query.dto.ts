import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ConfirmEnum, OrderbyEnum } from '../../../../common/constant/enum';
import { AdminLeaveSortEnum } from '../enum/leave.enum';

export class AdminLeaveFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '회계연도', type: String, example: '2025' })
  year: string;

  @ApiProperty({ name: 'userName', description: '검색 이름', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;

  @ApiProperty({ type: 'enum', enum: AdminLeaveSortEnum, description: '정렬 기준', required: false })
  @IsOptional()
  @IsEnum(AdminLeaveSortEnum)
  sortby?: AdminLeaveSortEnum;

  @ApiProperty({ type: 'enum', enum: OrderbyEnum, description: '정렬 방법', required: false })
  @IsOptional()
  @IsEnum(OrderbyEnum)
  orderby?: OrderbyEnum;
}

export class AdminLeaveDetailFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '검색연도', type: String, example: '2025' })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({ name: 'month', required: false, description: '검색월(개별 및 복수)', type: String })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];

  @ApiProperty({
    name: 'leaveTypeIdx',
    required: false,
    description: '분류',
    type: Number,
    example: 6,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  leaveTypeIdx?: number;
}

export class UserLeaveDetailFilterDto {
  @ApiProperty({ name: 'year', required: true, description: '검색연도', type: String, example: '2025' })
  @IsNotEmpty()
  @IsString()
  year: string;

  @ApiProperty({ name: 'month', required: false, description: '검색월(개별 및 복수)', type: String })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];

  @ApiProperty({
    name: 'leaveTypeIdx',
    required: false,
    description: '분류',
    type: Number,
    example: 6,
  })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  leaveTypeIdx?: number;

  @ApiProperty({ name: 'confirmYN', required: false, description: '결재여부', type: 'enum', enum: ConfirmEnum })
  confirmYN?: ConfirmEnum;
}
