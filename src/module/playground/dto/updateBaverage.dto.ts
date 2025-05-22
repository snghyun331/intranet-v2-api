import { ApiProperty } from '@nestjs/swagger';

export class UpdateBaverage {
  @ApiProperty({ name: 'configId', required: true, type: String, example: '64e2f4b8c9d3f1a0b8c8e4d5' })
  configId: string;

  @ApiProperty({ name: 'userName', required: true, type: String, example: '이승현' })
  userName: string;

  @ApiProperty({ name: 'baverage', required: true, type: String, example: '바닐라크림 콜드브루' })
  baverage: string;
}
