import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserApprovalFilter {
  @ApiProperty({ type: String, description: '검색연도', required: true })
  @IsNotEmpty({ message: '검색연도는 쿼리에 반드시 포함되어야합니다.' })
  @IsString()
  year: string;

  @ApiProperty({ name: 'month', required: false, description: '검색월(개별 및 복수)', type: String })
  @IsOptional()
  @Transform(({ value }) => decodeURIComponent(value).split(',')) // 쉼표로 구분된 문자열을 배열로 변환
  month?: string[];

  @ApiProperty({ type: Number, description: '대상자 IDX', required: false })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  userIdx?: number;
}
