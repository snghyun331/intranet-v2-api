import { IsNumber, IsString } from 'class-validator';

export class GetUserIdxDto {
  @IsNumber()
  userIdx: number;

  @IsString()
  userName: string;
}
