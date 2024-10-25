import { ApiProperty } from '@nestjs/swagger';
import { QnaCategoryEnum } from '../../../common/constant/enum';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateQnaDto {
  @ApiProperty({
    type: Object.values(QnaCategoryEnum),
    enum: QnaCategoryEnum,
    description: '문의 유형',
    required: true,
  })
  @IsNotEmpty({ message: '문의 유형은 필수로 선택해주세요.' })
  @IsEnum(QnaCategoryEnum)
  category: QnaCategoryEnum;

  @ApiProperty({ type: 'text', description: '문의 내용', required: true })
  @IsNotEmpty({ message: '문의 내용은 필수로 입력해주세요.' })
  @IsString()
  text: string;
}
