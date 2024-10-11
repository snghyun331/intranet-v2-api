import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateWelfareDto {
  @ApiProperty({ type: String, required: true })
  @IsNotEmpty({ message: '날짜는 필수로 입력해주세요.' })
  @IsString()
  targetDay: string;

  @ApiProperty({ type: Number, description: '결제 금액', required: true })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ type: String, description: '사용처', required: true })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({ type: String, description: '결제자(이름만 넣어주세요)', required: true })
  @IsNotEmpty()
  @IsString()
  payerName: string;
}
