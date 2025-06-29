import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';
import { MeetingTypeEnum } from '@common/constant/enum';
import { Transform } from 'class-transformer';

export class CreateMeetingReservationDto {
  @ApiProperty({ type: String, description: '제목(100자이내)', required: true })
  @IsNotEmpty({ message: '제목은 필수로 입력해주세요.' })
  @IsString()
  @MaxLength(100, { message: '제목은 100자 이내로 입력해주세요.' })
  title: string;

  @ApiProperty({ type: String, description: '내용', required: false })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ type: String, description: '회의일자', required: true })
  @IsNotEmpty({ message: '회의일자는 필수로 입력해주세요.' })
  @IsString()
  meetingDate: string;

  @ApiProperty({ type: String, description: '시작시간', required: true })
  @IsNotEmpty({ message: '시작시간은 필수로 입력해주세요.' })
  @IsString()
  startTime: string;

  @ApiProperty({ type: String, description: '종료시간', required: true })
  @IsNotEmpty({ message: '종료시간은 필수로 입력해주세요.' })
  @IsString()
  endTime: string;

  @ApiProperty({ type: String, description: '회의유형', required: true })
  @IsEnum(MeetingTypeEnum)
  meetingType: MeetingTypeEnum;

  @ApiProperty({ type: Number, description: '회의실Idx', required: true })
  @IsNumber()
  roomIdx: number;

  @ApiProperty({ type: Array, description: '참조 유저IDX (없으면 null)', example: [2], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    } else if (value === null) {
      return null;
    }
    return value;
  })
  ccUserIdxs?: number[] | null;

  @ApiProperty({ type: Array, description: '참석자 유저IDX (없으면 null)', example: [2], required: false })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(Number);
    } else if (value === null) {
      return null;
    }
    return value;
  })
  attendeeUserIdxs?: number[] | null;
}
