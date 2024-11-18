import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateMyPwDto {
  @ApiProperty({ type: String, description: '기존 비밀번호', required: true })
  @IsNotEmpty({ message: '기존 비밀번호를 입력해주세요' })
  @IsString()
  prePassword: string;

  @ApiProperty({ type: String, description: '새 비밀번호', required: true })
  @IsNotEmpty({ message: '새 비밀번호를 입력해주세요' })
  @IsString()
  newPassword: string;

  @ApiProperty({ type: String, description: '새 비밀번호 확인', required: true })
  @IsNotEmpty({ message: '새 비밀번호 확인을 입력해주세요' })
  @IsString()
  confirmPassword: string;
}
