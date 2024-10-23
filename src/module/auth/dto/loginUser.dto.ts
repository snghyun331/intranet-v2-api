import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ type: String, description: '아이디', required: true })
  @IsNotEmpty({ message: '아이디를 입력해주세요.' })
  @IsString()
  id: string;

  @ApiProperty({ type: String, description: '비밀번호', required: true })
  @IsNotEmpty({ message: '패스워드를 입력해주세요.' })
  @IsString()
  password: string;
}
