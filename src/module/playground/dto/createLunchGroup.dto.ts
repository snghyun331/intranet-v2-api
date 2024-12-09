import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateLunchGroupDto {
  @ApiProperty({ required: true, type: Number, description: '총 인원', example: 41 })
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
    example: '2024-12-10',
  })
  @IsNotEmpty({ message: '시작날짜를 선택해주세요' })
  @IsDateString()
  sDate: string;

  @ApiProperty({
    name: 'eDate',
    required: true,
    type: String,
    description: '종료 일자',
    example: '2024-12-12',
  })
  @IsNotEmpty({ message: '종료날짜를 선택해주세요' })
  @IsDateString()
  eDate: string;

  @ApiProperty({
    name: 'notice',
    type: String,
    description: '기타 공지사항',
    example: '박민수 본부장님 + 컨설팅팀, 김현근 본부장님 + HR운영팀',
    required: false,
  })
  @IsOptional()
  @IsString()
  notice: string;
}
