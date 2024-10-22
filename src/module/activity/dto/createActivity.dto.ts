import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ type: String, description: '활동비 사용일', required: true })
  @IsNotEmpty({ message: '날짜를 입력해주세요.' })
  @IsString()
  targetDay: string;

  @ApiProperty({ type: Number, description: '결제 금액', required: true })
  @IsNotEmpty({ message: '결제 금액을 입력해주세요.' })
  @IsNumber()
  amount: number;

  @ApiProperty({ type: String, description: '사용처', required: true })
  @IsNotEmpty({ message: '사용처를 입력해주세요.' })
  @IsString()
  content: string;

  @ApiProperty({ type: String, description: '법인카드 주인(이름만 넣어주세요)', required: true })
  @IsNotEmpty({ message: '결제자(법인카드 소유자) 이름을 입력해주세요.' })
  @IsString()
  payerName: string;
}
