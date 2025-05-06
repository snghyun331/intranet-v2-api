import { ApiProperty } from '@nestjs/swagger';
import { GenderEnum, YNEnum } from '@common/constant/enum';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ type: String, description: '로그인 아이디', required: true })
  @IsNotEmpty({ message: 'ID를 입력해주세요' })
  @IsString()
  id: string;

  @ApiProperty({ type: String, description: '성명', required: true })
  @IsNotEmpty({ message: '이름을 입력해주세요' })
  @IsString()
  userName: string;

  @ApiProperty({ type: Number, description: '직급IDX', required: true })
  @IsNotEmpty({ message: '직급을 선택해주세요' })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  gradeIdx: number;

  @ApiProperty({ type: String, description: '이메일', required: true })
  @IsNotEmpty({ message: '이메일을 입력해주세요' })
  @IsString()
  userEmail: string;

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

  @ApiProperty({ type: String, description: '생년월일', required: true })
  @IsNotEmpty({ message: '생년월일을 입력해주세요' })
  @IsDateString()
  userBirth: string;

  @ApiProperty({ type: 'enum', enum: GenderEnum, description: '성별', required: true })
  @IsNotEmpty({ message: '성별을 선택해주세요' })
  @IsEnum(GenderEnum)
  userGender: GenderEnum;

  @ApiProperty({ type: String, description: '가입일', required: true })
  @IsNotEmpty({ message: '입사일을 입력해주세요' })
  @IsDateString()
  joinDate: string;

  @ApiProperty({ type: 'enum', enum: YNEnum, description: '어드민 권한 여부', required: true })
  @IsNotEmpty({ message: '어드민 여부를 선택해주세요' })
  @IsEnum(YNEnum)
  adminRole: YNEnum;

  @ApiProperty({ type: Number, description: '어드민 등급 IDX', required: false })
  @IsOptional()
  @IsNumber()
  adminGradeIdx?: number;

  @ApiProperty({ type: String, description: '개인 이메일', required: false })
  @IsOptional()
  @IsString()
  userPersonalEmail?: string;

  @ApiProperty({ type: String, description: '계좌번호', required: false })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiProperty({ type: String, description: '계좌은행', required: false })
  @IsOptional()
  @IsString()
  accountBank?: string;

  @ApiProperty({ type: String, description: '여권성명', required: false })
  @IsOptional()
  @IsString()
  passportName?: string;

  @ApiProperty({ type: String, description: '여권생년월일', required: false })
  @IsOptional()
  @IsString()
  passportBirth?: string;

  @ApiProperty({ type: String, description: '여권번호', required: false })
  @IsOptional()
  @IsString()
  passportNo?: string;

  @ApiProperty({ type: String, description: '여권만료일', required: false })
  @IsOptional()
  @IsString()
  passportExpiry?: string;

  @ApiProperty({ type: String, description: '수습기간', required: false })
  @IsOptional()
  @IsString()
  probationPeriod?: string;
}
