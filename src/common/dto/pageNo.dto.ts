import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class PageNoDto {
  @ApiProperty({
    name: 'pageNo',
    type: Number,
    description: '페이지네이션 번호',
    example: 1,
    required: false,
  })
  @Type(() => Number)
  // 입력 값이 1보다 작거나 10,000보다 크다면 1로 강제로 변환, 1보다 크다면 값 그대로 출력
  @Transform(({ value }) => (value < 1 || value > 10000 ? 1 : value))
  @IsNumber()
  pageNo = 1;

  @ApiProperty({
    name: 'perPage',
    type: Number,
    description: '한 페이지당 보여 줄 목록 수 (기본 10개)',
    example: 10,
    required: false,
  })
  @Type(() => Number)
  // 입력 값이 1보다 작거나 10,000보다 크다면 10으로 강제로 변환, 아니라면 값 그대로 출력
  @Transform(({ value }) => (value < 1 || value > 10000 ? 10 : value))
  @IsNumber()
  perPage = 10;
}
