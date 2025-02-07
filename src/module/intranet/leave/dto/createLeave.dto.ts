import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { IntranetAttendanceEnum } from '../../../../common/constant/enum';

export class LeaveDetailDto {
  @ApiProperty({ type: String, description: '신청 날짜', example: '2025-01-04', required: true })
  @IsNotEmpty()
  @IsDateString()
  commuteDate: string;

  @ApiProperty({
    type: 'enum',
    enum: IntranetAttendanceEnum,
    description: '휴가 유형',
    example: '연차',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  attendance: IntranetAttendanceEnum;
}

export class LeaveRequestDto {
  @ApiProperty({ type: Array, description: '휴가 신청 정보', required: true })
  @ValidateNested({ each: true })
  @Type(() => LeaveDetailDto)
  leaveInfo: LeaveDetailDto[];

  @ApiProperty({ type: Number, description: '승인해줄 유저', example: 1, required: true })
  @IsNotEmpty()
  @IsNumber()
  confirmPersonIdx: number;
}

export class CreateLeaveDto {
  @ApiProperty({
    type: Object,
    description: 'json DTO 정보',
    required: true,
    example: {
      leaveInfo: [
        {
          commuteDate: '2025-01-04',
          attendance: '연차',
        },
        {
          commuteDate: '2025-01-05',
          attendance: '오후 반차',
        },
      ],
      confirmPersonIdx: 1,
    },
  })
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? JSON.parse(value) : value))
  dto: object;

  @ApiProperty({ type: String, format: 'binary', description: '첨부사진', required: false })
  @IsOptional()
  leaveImage?: any;
}
