import { ApiProperty, PickType } from '@nestjs/swagger';
import { CreateUserDto } from './createUser.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateUserDto extends PickType(CreateUserDto, [
  'id',
  'userName',
  'gradeIdx',
  'userEmail',
  'userCell',
  'userAddress',
  'userBirth',
  'userGender',
  'joinDate',
  'adminRole',
  'adminGradeIdx',
]) {
  @ApiProperty({ type: Number, description: '본부IDX', required: false })
  @IsOptional()
  @IsNumber()
  hqIdx?: number;

  @ApiProperty({ type: Number, description: '팀IDX', required: false })
  @IsOptional()
  @IsNumber()
  teamIdx?: number;
}
