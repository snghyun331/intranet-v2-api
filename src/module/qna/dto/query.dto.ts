import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { YNEnum } from '../../../common/constant/enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QnaFilterDto {
  @ApiProperty({ type: 'enum', enum: YNEnum, description: 'Q&A 내용', example: 'N', required: false })
  @IsOptional()
  @IsEnum(YNEnum)
  replySuccessYN?: YNEnum;

  @ApiProperty({ type: String, description: 'Q&A 내용', example: '010-4194-5718', required: false })
  @IsOptional()
  @IsString()
  userCell?: string;
}

export class PaginationDto extends IntersectionType(PageNoDto, QnaFilterDto) {}
