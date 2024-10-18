import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { YNEnum } from '../../../common/constant/enum';

export class CreateWelfareDto {
  @ApiProperty({ type: String, description: '복포 사용일', required: true })
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

  @ApiProperty({ type: String, description: '결제자(이름만 넣어주세요)', required: true })
  @IsNotEmpty({ message: '결제자 이름을 입력해주세요.' })
  @IsString()
  payerName: string;

  @ApiProperty({
    type: Array,
    description: '대리 결제자IDX(number) 리스트',
    required: true,
  })
  @IsNotEmpty()
  @IsArray()
  payeeIdxs: number[];

  @ApiProperty({ type: 'enum', enum: YNEnum, description: '본인 등록 여부', required: true })
  @IsNotEmpty()
  @IsEnum(YNEnum)
  selfWrittenYN: YNEnum;
}
