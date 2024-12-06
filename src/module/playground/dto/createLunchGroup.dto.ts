import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateLunchGroupDto {
  @ApiProperty({ required: true, type: Number, description: '총 인원', example: 40 })
  @IsNotEmpty({ message: '총 인원 수를 입력해주세요' })
  @IsNumber()
  total: number;

  @ApiProperty({ name: 'perGroup', type: Number, required: true, description: '한 조에 들어갈 인원', example: 10 })
  @IsNotEmpty({ message: '한 조에 들어갈 인원 수를 입력해주세요' })
  @IsNumber()
  perGroup: number;

  @ApiProperty({
    name: 'sDate',
    required: true,
    type: String,
    description: '시작 일자',
    example: '2024-11-01',
  })
  @IsNotEmpty({ message: '시작날짜를 선택해주세요' })
  @IsDateString()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자',
    example: '2024-11-08',
  })
  @IsNotEmpty({ message: '종료날짜를 선택해주세요' })
  @IsDateString()
  eDate: string;
}
