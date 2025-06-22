import { ApiProperty } from '@nestjs/swagger';

export class CreateUser {
  @ApiProperty({ type: Number, required: true })
  userIdx: number;

  @ApiProperty({ type: String, required: true })
  userName: string;
}
