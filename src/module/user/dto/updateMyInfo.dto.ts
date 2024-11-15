import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpdateMyInfoDto {
  @ApiProperty({ type: String, description: '전화번호', required: true })
  @IsNotEmpty({ message: '연락처를 입력해주세요' })
  @Matches(/^(\d{3})-(\d{4})-(\d{3,4})$/, {
    message: '휴대전화번호는 000-0000-0000(000) 형식이어야 합니다.',
  })
  @IsString()
  userCell: string;

  @ApiProperty({ type: String, description: '집 주소', required: true })
  @IsNotEmpty({ message: '주소를 입력해주세요' })
  @IsString()
  userAddress: string;
}
