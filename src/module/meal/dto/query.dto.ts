import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminMealFilterDto {
  @ApiProperty({
    name: 'sDate',
    required: true,
    type: String,
    description: '시작 일자',
    example: '2024-11-01',
  })
  @IsNotEmpty({ message: '날짜를 선택해주세요' })
  @IsDateString()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자',
    example: '2024-11-20',
  })
  @IsNotEmpty({ message: '날짜를 선택해주세요' })
  @IsDateString()
  eDate: string;

  @ApiProperty({ name: 'userName', description: '검색 이름', example: '이승현', type: String, required: false })
  @IsOptional()
  @IsString()
  userName?: string;
}

export class AdminMealBudgetFilterDto {
  @ApiProperty({ type: String, description: '연도', example: '2024', required: true })
  @IsNotEmpty({ message: '연도를 입력해주세요.' })
  @IsString()
  year: string;

  @ApiProperty({ type: String, description: '월', example: '8', required: true })
  @IsNotEmpty({ message: '월을 입력해주세요.' })
  @IsString()
  month: string;
}

export class AdminMealBalanceFilterDto {
  @ApiProperty({ type: String, description: '연도', example: '2024', required: true })
  @IsNotEmpty({ message: '연도를 입력해주세요.' })
  @IsString()
  year: string;

  @ApiProperty({ type: String, description: '월', example: '8', required: true })
  @IsNotEmpty({ message: '월을 입력해주세요.' })
  @IsString()
  month: string;
}
