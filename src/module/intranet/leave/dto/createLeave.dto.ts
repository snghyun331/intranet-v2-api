import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';

export class LeaveDetailDto {
  @ApiProperty({ type: String, description: '신청 날짜', example: '2025-01-04', required: true })
  @IsNotEmpty()
  @IsDateString()
  commuteDate: string;

  @ApiProperty({
    type: Number,
    description: '휴가유형IDX',
    example: 6,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  leaveTypeIdx: number;
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
          leaveTypeIdx: 6,
        },
        {
          commuteDate: '2025-01-05',
          leaveTypeIdx: 3,
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
